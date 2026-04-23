// ─── GOATED NOTIFICATIONS ──────────────────────────────────────────
// Thin wrapper over the browser Notification API with a graceful toast
// fallback. Designed for real-time alpha alerts (market plays, hot
// leads in negotiation, closed-deal celebrations).
//
// Usage:
//   import { notify, requestNotifPermission, getNotifPermission } from '@/utils/notifications';
//   await requestNotifPermission();  // prompt once, returns 'granted' | 'denied' | 'default'
//   notify({ title: 'BTC +5.2%', body: 'Alpha Radar: momentum play triggered', tag: 'alpha-btc' });

const STORAGE_KEY = 'goated_notif_enabled';

export function getNotifPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission; // 'granted' | 'denied' | 'default'
}

export function isNotifEnabled() {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) !== 'false';
}

export function setNotifEnabled(on) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, on ? 'true' : 'false');
  }
}

export async function requestNotifPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch {
    return 'denied';
  }
}

// Simple in-app toast registry — AIOverlay or any component can listen
const toastListeners = new Set();

export function subscribeToToasts(listener) {
  toastListeners.add(listener);
  return () => toastListeners.delete(listener);
}

function emitToast(payload) {
  toastListeners.forEach(fn => {
    try { fn(payload); } catch { /* ignore */ }
  });
}

/**
 * Fire a notification. Uses native Notification API when permitted, always
 * fires an in-app toast for subscribers, and respects user opt-out.
 *
 * @param {Object} opts
 * @param {string} opts.title
 * @param {string} [opts.body]
 * @param {string} [opts.tag] - de-duplicates repeat alerts
 * @param {string} [opts.icon] - URL
 * @param {string} [opts.category] - 'ALPHA' | 'LEAD' | 'MARKET' | 'CLOSING' | 'SYSTEM'
 * @param {Function} [opts.onClick]
 * @param {boolean} [opts.silent] - skip browser notification, still emits toast
 */
export function notify({ title, body = '', tag, icon, category = 'SYSTEM', onClick, silent = false }) {
  if (!isNotifEnabled()) return null;

  const payload = { title, body, tag, icon, category, ts: Date.now() };
  emitToast(payload);

  if (silent) return payload;

  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      const notif = new Notification(title, {
        body,
        tag,
        icon: icon || '/goated-icon.svg',
        badge: icon || '/goated-icon.svg',
        silent: false,
      });
      if (onClick) {
        notif.onclick = () => {
          window.focus();
          onClick();
          notif.close();
        };
      }
      // Auto-dismiss after 8s to avoid pile-up
      setTimeout(() => notif.close(), 8000);
    } catch {
      // silent fail — toast fallback already fired
    }
  }

  return payload;
}

// Convenience wrappers per category
export const notifyAlpha = (title, body, extras = {}) =>
  notify({ title, body, category: 'ALPHA', ...extras });
export const notifyLead = (title, body, extras = {}) =>
  notify({ title, body, category: 'LEAD', ...extras });
export const notifyClosing = (title, body, extras = {}) =>
  notify({ title, body, category: 'CLOSING', ...extras });
