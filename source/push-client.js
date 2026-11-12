const CHAMBOULE_PUSH = (() => {
  const URL_PUSH = 'https://ivkbevrfmzdbvrsuwmtx.supabase.co/functions/v1/chamboule-push';
  const TOKEN_KEY = 'chamboule-push-token-v1';
  const TIMEOUT = 10000;
  const EMPTY = { active: false, paired: false, morning: null, evening: null, zone: null };
  const OFFLINE = 'Le service de notifications est injoignable. Vérifie ta connexion, puis réessaie.';
  const NOT_READY = 'Chamboule n’est pas encore prêt pour les notifications. Recharge l’appli, puis réessaie.';

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

  function settingsResponse(result) {
    if (typeof result.active !== 'boolean' || typeof result.paired !== 'boolean') {
      throw failure('Chamboule n’a pas reçu de confirmation de tes réglages. Réessaie.', 'invalid_response');
    }
    const { active, paired, morning = null, evening = null, zone = null } = result;
    return { active, paired, morning, evening, zone };
  }

  async function status() {
    const token = readToken();
    if (!token) return { ...EMPTY };
    const result = settingsResponse(await request({ action: 'status', token }));
    if (!result.active) return result;
    if (permission() !== 'granted') return { ...result, active: false };
    const worker = await registration();
    return (await worker.pushManager.getSubscription()) ? result : { ...result, active: false };
  }

  async function enable(code, schedule) {
    const pairingCode = String(code || '').replace(/[\s-]+/g, '').toLowerCase();
    const knownToken = readToken();
    if (!knownToken && !pairingCode) throw failure('Saisis ton code d’activation.', 'pairing_required');
    if (pairingCode && !/^[0-9a-f]{32}$/.test(pairingCode)) {
      throw failure('Vérifie ton code d’activation. Il contient 32 caractères.', 'pairing_invalid');
    }
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
    const [worker, config] = await Promise.all([registration(), request()]);
    const push = await subscription(worker, applicationServerKey(config.publicKey));
    return settingsResponse(await request({
      action: 'enable', token, ...(pairingCode && { code: pairingCode }), subscription: push.toJSON(), ...scheduleFields(schedule)
    }));
  }

  async function save(schedule) {
    return settingsResponse(await request({ action: 'save', token: requireToken(), ...scheduleFields(schedule) }));
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
    const result = await request({ action: 'test', token: requireToken() });
    if (result.sent !== true) {
      throw failure('Le service n’a pas confirmé l’envoi du test. Réessaie.', 'invalid_response');
    }
    return { sent: true };
  }

  return { supported, permission, hasToken: () => !!readToken(), status, enable, save, disable, test };
})();
