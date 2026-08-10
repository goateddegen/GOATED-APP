// =============================================================================
// GOATED — Deep lead storage (IndexedDB)
// -----------------------------------------------------------------------------
// localStorage caps the app at roughly 700 leads per list: ~5MB per ORIGIN,
// shared between the live list and the no-website list, and a lead is ~3.3KB
// even after slimming. IndexedDB has no such ceiling in practice — browsers
// allow a large share of free disk — and it stores structured values, so leads
// go in whole rather than through JSON.stringify.
//
// This does NOT replace localStorage. It sits behind it:
//
//   localStorage  synchronous, small, read during store construction so the
//                 leads page paints instantly with something real.
//   IndexedDB     asynchronous, deep, hydrated just after mount and merged in.
//
// Splitting them this way avoids rewriting the store's synchronous initializer,
// which is the risky part — an async initializer would mean the page renders
// empty on every load and fills in a beat later, which is worse than the cap.
//
// Every function here resolves rather than throws. Storage is a cache: a browser
// in private mode, a full disk or a blocked origin should degrade to "fewer
// leads", never to a broken page.
// =============================================================================

const DB_NAME = 'goated';
const DB_VERSION = 1;
const STORE = 'leads';

let dbPromise = null;

function supported() {
  return typeof indexedDB !== 'undefined';
}

function open() {
  if (!supported()) return Promise.resolve(null);
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    let req;
    try { req = indexedDB.open(DB_NAME, DB_VERSION); }
    catch { resolve(null); return; }
    req.onupgradeneeded = () => {
      const db = req.result;
      // Keyed by list name ('live' / 'no-website'), holding the whole array.
      // Per-lead rows would allow partial reads we never make, and would cost a
      // transaction per lead on write.
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
    req.onblocked = () => resolve(null);
  });
  return dbPromise;
}

/** Write a list. Fire-and-forget: never block a render on persistence. */
export async function saveLeadsDeep(key, leads) {
  const db = await open();
  if (!db) return false;
  return new Promise((resolve) => {
    let tx;
    try { tx = db.transaction(STORE, 'readwrite'); }
    catch { resolve(false); return; }
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => resolve(false);
    tx.onabort = () => resolve(false);   // quota exceeded lands here
    try { tx.objectStore(STORE).put(leads, key); }
    catch { resolve(false); }
  });
}

/** Read a list back. Resolves to [] when there is nothing or IDB is unavailable. */
export async function loadLeadsDeep(key) {
  const db = await open();
  if (!db) return [];
  return new Promise((resolve) => {
    let tx;
    try { tx = db.transaction(STORE, 'readonly'); }
    catch { resolve([]); return; }
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve(Array.isArray(req.result) ? req.result : []);
    req.onerror = () => resolve([]);
  });
}

/** Roughly how much has been stored, for the operator-facing counter. */
export async function deepCounts(keys) {
  const out = {};
  for (const k of keys) out[k] = (await loadLeadsDeep(k)).length;
  return out;
}
