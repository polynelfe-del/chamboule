const CHAMBOULE_PUSH = (() => {
  const URL_PUSH = 'https://ivkbevrfmzdbvrsuwmtx.supabase.co/functions/v1/chamboule-push';
  const TOKEN_KEY = 'chamboule-push-token-v1';
  const LINK_KEY = 'chamboule-push-link-v1';
  const TIMEOUT = 10000;
  const EMPTY = { active: false, paired: false, receivable: false, morning: null, evening: null, zone: null };
  const OFFLINE = 'Le service de notifications est injoignable. Vérifie ta connexion, puis réessaie.';
  const NOT_READY = 'La mise à jour des notifications se termine. Recharge Chamboule, puis réessaie.';

  let linkCode = '';
  let openedWithLink = false;
  if (!window.claude) {
    const code = /^#activer=([0-9a-f]{32})$/.exec(window.location.hash)?.[1];
    if (code) {
      linkCode = code;
      openedWithLink = true;
      const url = new URL(window.location.href);
      url.hash = '';
      window.history.replaceState(window.history.state, '', url.href);
      try { sessionStorage.setItem(LINK_KEY, code); } catch {}
    } else {
      try { linkCode = sessionStorage.getItem(LINK_KEY) || ''; } catch {}
    }
  }
  function clearLink() {
    linkCode = '';
    try { sessionStorage.removeItem(LINK_KEY); } catch {}
  }

  function failure(message, code) {
    return Object.assign(new Error(message), { code });
  }

  function supported() {
    try {
      return !window.claude && window.isSecureContext === true && !!navigator.serviceWorker
        && typeof window.PushManager === 'function'
        && typeof window.Notification?.requestPermission === 'function';
    } catch {
      return false;
    }
  }

  function permission() {
    return supported() ? window.Notification.permission : 'unsupported';
  }

  function requirePermission() {
    const value = permission();
    if (value === 'unsupported') {
      throw failure('Ouvre Chamboule dans Chrome sur ton téléphone pour activer les notifications.', 'unsupported');
    }
    if (value === 'denied') {
      throw failure('Les notifications sont bloquées. Autorise-les pour Chamboule dans les paramètres de Chrome et du téléphone.', 'permission_denied');
    }
    return value;
  }

  function readToken() {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      return typeof token === 'string' && /^[\w-]{43}$/.test(token) ? token : null;
    } catch {
      return null;
    }
  }

  function requireToken() {
    const token = readToken();
    if (!token) throw failure('Active d’abord les notifications sur ce téléphone.', 'not_paired');
    return token;
  }

  function createToken() {
    const bytes = window.crypto.getRandomValues(new Uint8Array(32));
    const token = btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    try {
      localStorage.setItem(TOKEN_KEY, token);
      if (readToken() === token) return token;
    } catch {
      // Keep the server untouched if the browser cannot remember this device.
    }
    throw failure('Chrome ne peut pas mémoriser ce téléphone. Rouvre Chamboule hors navigation privée.', 'storage_unavailable');
  }

  async function request(body) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);
    let response;
    let result;
    try {
      response = await fetch(URL_PUSH, {
        ...(body && { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
        cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer', redirect: 'error', signal: controller.signal
      });
      try { result = await response.json(); } catch (error) { if (controller.signal.aborted) throw error; }
    } catch {
      throw failure(OFFLINE, 'network');
    } finally {
      clearTimeout(timer);
    }
    if (!response.ok) {
      const code = typeof result?.code === 'string' ? result.code : 'service_unavailable';
      const message = response.status < 500 && typeof result?.error === 'string' && result.error.length <= 240
        ? result.error : 'Le service de notifications est momentanément indisponible. Réessaie dans un instant.';
      throw failure(message, code);
    }
    if (!result || typeof result !== 'object') {
      throw failure('Chamboule n’a pas reçu de confirmation du service de notifications. Réessaie.', 'invalid_response');
    }
    return result;
  }

  function withTimeout(promise) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(failure(NOT_READY, 'worker_not_ready')), TIMEOUT);
      promise.then(resolve, reject).finally(() => clearTimeout(timer));
    });
  }

  function ownScope(registration) {
    return registration?.scope === new URL('./', window.location.href).href;
  }

  async function registration() {
    try {
      const serviceWorker = navigator.serviceWorker;
      const existing = await withTimeout(serviceWorker.getRegistration());
      if (ownScope(existing) && existing.active && existing.pushManager) return existing;
      const ready = await withTimeout(serviceWorker.ready);
      if (ownScope(ready) && ready.active && ready.pushManager) return ready;
    } catch {
      // A registration can fail when a page is embedded or the browser blocks workers.
    }
    throw failure(NOT_READY, 'worker_not_ready');
  }

  function supportsPush(worker) {
    if (!worker || typeof worker.postMessage !== 'function') return Promise.resolve(false);
    return new Promise(resolve => {
      const channel = new MessageChannel();
      const finish = supported => { clearTimeout(timer); channel.port1.close(); resolve(supported); };
      const timer = setTimeout(() => finish(false), 350);
      channel.port1.onmessage = event => finish(event.data === 'chamboule-push-v2');
      try { worker.postMessage('chamboule-push-capability', [channel.port2]); }
      catch { channel.port2.close(); finish(false); }
    });
  }

  async function updatedRegistration() {
    const reg = await registration();
    if (await supportsPush(reg.active)) return reg;
    // A previously installed PWA can still be controlled by the worker from the agenda version.
    Promise.resolve().then(() => reg.update()).catch(() => {});
    const deadline = Date.now() + TIMEOUT;
    while (Date.now() < deadline) {
      await new Promise(resolve => setTimeout(resolve, 250));
      if (await supportsPush(reg.active)) return reg;
    }
    throw failure(NOT_READY, 'worker_not_ready');
  }

  function applicationServerKey(value) {
    try {
      if (typeof value === 'string' && /^[\w-]{87}$/.test(value)) {
        const key = Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/') + '='), char => char.charCodeAt(0));
        if (key.length === 65 && key[0] === 4) return key;
      }
    } catch {
      // An invalid public key is a service configuration error.
    }
    throw failure('Le service de notifications n’est pas prêt. Réessaie dans un instant.', 'invalid_key');
  }

  async function subscription(worker, key) {
    try {
      const current = await worker.pushManager.getSubscription();
      if (current) {
        const currentKey = new Uint8Array(current.options.applicationServerKey || 0);
        if (currentKey.length === key.length && currentKey.every((value, index) => value === key[index])) return current;
        await current.unsubscribe();
      }
      return await worker.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
    } catch {
      requirePermission();
      throw failure('Chrome n’a pas pu enregistrer ce téléphone. Vérifie ta connexion, puis réessaie.', 'subscription_failed');
    }
  }

  function scheduleFields(schedule) {
    return { zone: schedule.zone, morning: schedule.morning, evening: schedule.evening };
  }

  function settingsResponse(result, receivable = false) {
    if (typeof result.active !== 'boolean' || typeof result.paired !== 'boolean') {
      throw failure('Chamboule n’a pas reçu de confirmation de tes réglages. Réessaie.', 'invalid_response');
    }
    const { active, paired, morning = null, evening = null, zone = null } = result;
    return { active, paired, receivable: active && receivable, morning, evening, zone };
  }

  async function status() {
    const token = readToken();
    if (!token) return { ...EMPTY };
    const result = settingsResponse(await request({ action: 'status', token }));
    if (!result.active || permission() !== 'granted') return result;
    try {
      const worker = await registration();
      return { ...result, receivable: !!(await worker.pushManager.getSubscription()) };
    } catch {
      return result;
    }
  }

  async function enable(schedule) {
    const pairingCode = linkCode;
    const knownToken = readToken();
    if (!knownToken && !pairingCode) throw failure('Ouvre ton lien privé Chamboule sur ton Xiaomi pour activer les rappels.', 'pairing_required');
    const currentPermission = requirePermission();
    let allowed = currentPermission;
    if (currentPermission !== 'granted') {
      // Start the native prompt directly in the click handler, before any network request.
      try { allowed = await window.Notification.requestPermission(); } catch { allowed = permission(); }
    }
    if (allowed !== 'granted') {
      requirePermission();
      throw failure('Appuie de nouveau sur Activer, puis choisis Autoriser dans Chrome.', 'permission_required');
    }
    const token = knownToken || createToken();
    const [worker, config] = await Promise.all([updatedRegistration(), request()]);
    const push = await subscription(worker, applicationServerKey(config.publicKey));
    try {
      const settings = settingsResponse(await request({
        action: 'enable', token, ...(pairingCode && { code: pairingCode }), subscription: push.toJSON(), ...scheduleFields(schedule)
      }), true);
      clearLink();
      return settings;
    } catch (error) {
      if (['pairing_invalid', 'pairing_required'].includes(error.code)) {
        clearLink();
        throw failure('Ce lien d’activation a expiré ou a déjà servi. Il faut un nouveau lien privé.', error.code);
      }
      throw error;
    }
  }

  async function save(schedule) {
    return settingsResponse(await request({ action: 'save', token: requireToken(), ...scheduleFields(schedule) }), true);
  }

  async function disable() {
    const result = settingsResponse(await request({ action: 'disable', token: requireToken() }));
    if (!result.active && supported()) {
      try {
        const worker = await registration();
        const push = await worker.pushManager.getSubscription();
        await push?.unsubscribe();
      } catch {
        // The server already confirmed deactivation; the browser might already have removed it.
      }
    }
    return result;
  }

  async function test() {
    if (requirePermission() !== 'granted') throw failure('Active d’abord les notifications sur ce téléphone.', 'permission_required');
    await updatedRegistration();
    const result = await request({ action: 'test', token: requireToken() });
    if (result.sent !== true) {
      throw failure('Le service n’a pas confirmé l’envoi du test. Réessaie.', 'invalid_response');
    }
    return { sent: true };
  }

  return { supported, permission, hasToken: () => !!readToken(), hasLink: () => !!linkCode, openedWithLink, status, enable, save, disable, test };
})();
