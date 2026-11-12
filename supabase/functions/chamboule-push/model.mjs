const HEX_PAIRING_CODE = /^[0-9a-f]{32}$/;
const TOKEN = /^[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]$/;
const TIME = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function tokenValue(value) {
  if (typeof value !== 'string' || !TOKEN.test(value)) {
    throw new HttpError(400, 'invalid_token', 'Ouvre Chamboule depuis ton navigateur.');
  }
  return value;
}

export function pairingValue(value) {
  const code = typeof value === 'string' ? value.replace(/[\s-]/g, '').toLowerCase() : '';
  return HEX_PAIRING_CODE.test(code) ? code : null;
}

export function scheduleValues(input) {
  const time = (value) => {
    if (value === null || (typeof value === 'string' && TIME.test(value))) return value;
    throw new HttpError(400, 'invalid_time', 'Choisis une heure valide pour chaque rappel activé.');
  };
  if (typeof input.zone !== 'string' || input.zone.length > 64 || !/^[A-Za-z_][A-Za-z0-9_+/-]*$/.test(input.zone)) {
    throw new HttpError(400, 'invalid_zone', 'Le fuseau horaire de ton téléphone est introuvable.');
  }
  try {
    new Intl.DateTimeFormat('fr-FR', { timeZone: input.zone });
  } catch {
    throw new HttpError(400, 'invalid_zone', 'Le fuseau horaire de ton téléphone est introuvable.');
  }
  return { zone: input.zone, morning: time(input.morning), evening: time(input.evening) };
}

export function subscriptionValue(subscription) {
  const invalid = () => new HttpError(400, 'invalid_subscription', 'Ouvre Chamboule dans Chrome sur ton Xiaomi.');
  if (typeof subscription?.endpoint !== 'string' || subscription.endpoint.length > 800) throw invalid();
  let endpoint;
  try {
    endpoint = new URL(subscription.endpoint);
  } catch {
    throw invalid();
  }
  if (endpoint.origin !== 'https://fcm.googleapis.com' || endpoint.username || endpoint.password || endpoint.hash || endpoint.search ||
      !/^\/(?:fcm\/send|wp)\/[A-Za-z0-9_:%=-]+$/.test(endpoint.pathname)) {
    throw invalid();
  }
  const { p256dh, auth } = subscription.keys ?? {};
  if (typeof p256dh !== 'string' || !/^B[A-Za-z0-9_-]{85}[AEIMQUYcgkosw048]$/.test(p256dh) ||
      typeof auth !== 'string' || !/^[A-Za-z0-9_-]{21}[AQgw]$/.test(auth)) {
    throw invalid();
  }
  return { endpoint: endpoint.href, keys: { p256dh, auth } };
}

export async function sha256(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
