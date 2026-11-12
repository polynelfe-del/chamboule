const CHAMBOULE_PUSH = (() => {
  const bridge = window.ChambouleAndroid;
  const permissionEvent = 'chamboule-native-notifications';

  function decode(text) {
    let result;
    try { result = JSON.parse(text); } catch {}
    if (!result || typeof result !== 'object') throw new Error('Chamboule ne peut pas ouvrir les réglages Android.');
    if (result.error) throw Object.assign(new Error(result.error), { code: result.code });
    return result;
  }

  function current() { return decode(bridge.status()); }

  function waitForPermission() {
    return new Promise((resolve, reject) => {
      const finish = () => {
        clearTimeout(timeout);
        window.removeEventListener(permissionEvent, changed);
        try { resolve(current()); } catch (error) { reject(error); }
      };
      const changed = event => {
        if (event.detail?.permissionFinished || current().permission !== 'default') finish();
      };
      const timeout = setTimeout(finish, 60000);
      window.addEventListener(permissionEvent, changed);
      try { bridge.requestPermissions(); }
      catch (error) {
        clearTimeout(timeout);
        window.removeEventListener(permissionEvent, changed);
        reject(error);
      }
    });
  }

  async function save(schedule) {
    return decode(bridge.save(schedule.morning || '', schedule.evening || ''));
  }

  async function enable(schedule) {
    let settings = current();
    if (settings.permission === 'default') settings = await waitForPermission();
    if (settings.permission !== 'granted') throw new Error('Autorise les notifications de Chamboule dans les réglages Android.');
    return save(schedule);
  }

  return {
    native: true,
    supported: () => !!bridge,
    permission: () => bridge ? current().permission : 'unsupported',
    hasToken: () => !!bridge,
    hasLink: () => false,
    openedWithLink: false,
    status: async () => current(),
    enable,
    save,
    disable: async () => decode(bridge.disable()),
    test: async () => decode(bridge.test()),
    requestExactAlarm: () => bridge.requestExactAlarm(),
    openNotificationSettings: () => bridge.openNotificationSettings()
  };
})();
