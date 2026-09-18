/**
 * PIN helpers: the PIN is never stored in plain text anymore.
 * We store `sha256:<hex>` and verify with WebCrypto. Legacy 4-digit plain PINs
 * are still accepted for verification and upgraded transparently on first use.
 */
const PREFIX = 'sha256:';
const SALT = 'almo-ai::pin::v1';

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function isHashedPin(value: string | undefined | null): boolean {
  return !!value && value.startsWith(PREFIX);
}

export async function hashPin(pin: string): Promise<string> {
  return PREFIX + (await sha256(`${SALT}:${pin}`));
}

export async function verifyPin(candidate: string, stored: string | undefined | null): Promise<boolean> {
  if (!stored) return false;
  if (isHashedPin(stored)) {
    return (await hashPin(candidate)) === stored;
  }
  // Legacy plain-text PIN
  return candidate === stored;
}

/** Client-side brute force protection state (persisted per browser). */
const LOCK_KEY = 'almo_pin_lock';
interface LockState { failures: number; until: number; }

export function getPinLock(): LockState {
  try {
    const raw = sessionStorage.getItem(LOCK_KEY);
    return raw ? JSON.parse(raw) : { failures: 0, until: 0 };
  } catch {
    return { failures: 0, until: 0 };
  }
}

export function registerPinFailure(): LockState {
  const st = getPinLock();
  const failures = st.failures + 1;
  // 3 free tries, then exponential backoff: 15s, 30s, 60s, 120s ... capped at 10 min
  const until = failures >= 3 ? Date.now() + Math.min(15_000 * 2 ** (failures - 3), 600_000) : 0;
  const next = { failures, until };
  sessionStorage.setItem(LOCK_KEY, JSON.stringify(next));
  return next;
}

export function clearPinLock() {
  sessionStorage.removeItem(LOCK_KEY);
}
