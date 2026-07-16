'use client';

/**
 * Device-local saved files ("bookmarks") — the one deliberate exception to
 * "refresh resets everything," amended in the README (2026-07-15).
 *
 * The contract that makes this compatible with ZERO-PII:
 *   - Stored in IndexedDB on the visitor's device. Never sent to the server,
 *     never attached to any request, never tied to an identity (none exists).
 *   - Contents are review ids only ({ id, addedAt }).
 *   - Transfer between devices happens through a URL *fragment* (#b=...),
 *     which browsers never transmit to the server, or a JSON file download.
 *
 * IndexedDB over localStorage: async, readable from the service worker if we
 * ever need it, and the storage the persist() machinery is designed around.
 */

const DB_NAME = 'abyatv';
const STORE = 'bookmarks';
const META_STORE = 'meta'; // anonymous device prefs (e.g. install-prompt dismissal)
const EVENT = 'abya:bookmarks-changed';

type BookmarkRow = { id: string; addedAt: number };

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: 'id' });
      }
      if (!req.result.objectStoreNames.contains(META_STORE)) {
        req.result.createObjectStore(META_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Anonymous device-local preference (never sent anywhere). */
export async function getMeta<T>(key: string): Promise<T | undefined> {
  try {
    const db = await openDb();
    try {
      return await new Promise<T | undefined>((resolve, reject) => {
        const req = db.transaction(META_STORE, 'readonly').objectStore(META_STORE).get(key);
        req.onsuccess = () => resolve(req.result as T | undefined);
        req.onerror = () => reject(req.error);
      });
    } finally {
      db.close();
    }
  } catch {
    return undefined;
  }
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  try {
    const db = await openDb();
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(META_STORE, 'readwrite');
        tx.objectStore(META_STORE).put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } finally {
      db.close();
    }
  } catch {
    /* degrade quietly */
  }
}

async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const req = fn(tx.objectStore(STORE));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

function notifyChanged() {
  window.dispatchEvent(new Event(EVENT));
}

export function onBookmarksChanged(cb: () => void): () => void {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

export async function getBookmarkIds(): Promise<string[]> {
  try {
    const rows = await withStore<BookmarkRow[]>('readonly', (s) => s.getAll());
    return rows.sort((a, b) => b.addedAt - a.addedAt).map((r) => r.id);
  } catch {
    return []; // IndexedDB unavailable (private mode edge cases) — degrade quietly
  }
}

export async function isBookmarked(id: string): Promise<boolean> {
  try {
    const row = await withStore<BookmarkRow | undefined>('readonly', (s) => s.get(id));
    return !!row;
  } catch {
    return false;
  }
}

export async function toggleBookmark(id: string): Promise<boolean> {
  const had = await isBookmarked(id);
  try {
    if (had) {
      await withStore('readwrite', (s) => s.delete(id));
    } else {
      await withStore('readwrite', (s) => s.put({ id, addedAt: Date.now() }));
      requestPersistence(); // ask the browser not to evict, once real data exists
    }
    notifyChanged();
  } catch {
    /* degrade quietly */
  }
  return !had;
}

export async function addBookmarks(ids: string[]): Promise<void> {
  const now = Date.now();
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      for (const [i, id] of ids.entries()) {
        // getAll sorts newest-first; offset keeps the imported order stable.
        const req = store.get(id);
        req.onsuccess = () => {
          if (!req.result) store.put({ id, addedAt: now - i });
        };
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    requestPersistence();
    notifyChanged();
  } catch {
    /* degrade quietly */
  }
}

/**
 * Best-effort "please don't evict" flag. Auto-granted for installed PWAs on
 * Chromium; heuristically granted for home-screen web apps on iOS 17+.
 * No prompt on Safari/Chrome; a real prompt only on Firefox.
 */
function requestPersistence() {
  navigator.storage?.persist?.().catch(() => {});
}

/* ------------------------------------------------------------------ */
/* Fragment-URL transfer: bookmarks move device-to-device with zero    */
/* server knowledge. Fragments (#...) are never sent in HTTP requests. */
/* ------------------------------------------------------------------ */

const FRAGMENT_KEY = 'b';

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function deflate(text: string): Promise<Uint8Array | null> {
  if (typeof CompressionStream === 'undefined') return null;
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function inflate(bytes: Uint8Array): Promise<string> {
  const stream = new Blob([bytes as BlobPart])
    .stream()
    .pipeThrough(new DecompressionStream('deflate-raw'));
  return new Response(stream).text();
}

/** Encode the current bookmark set as a shareable URL (state in the fragment). */
export async function bookmarksToShareUrl(): Promise<string | null> {
  const ids = await getBookmarkIds();
  if (ids.length === 0) return null;
  const json = JSON.stringify(ids);
  const compressed = await deflate(json);
  const payload = compressed
    ? `1.${toBase64Url(compressed)}`
    : `0.${toBase64Url(new TextEncoder().encode(json))}`;
  return `${window.location.origin}/directory#${FRAGMENT_KEY}=${payload}`;
}

/** Decode a #b=... fragment into review ids. Returns null when absent/invalid. */
export async function bookmarksFromFragment(hash: string): Promise<string[] | null> {
  const m = hash.match(new RegExp(`[#&]${FRAGMENT_KEY}=([^&]+)`));
  if (!m) return null;
  try {
    const [version, data] = m[1].split('.');
    const bytes = fromBase64Url(data);
    const json = version === '1' ? await inflate(bytes) : new TextDecoder().decode(bytes);
    const ids = JSON.parse(json);
    if (!Array.isArray(ids) || !ids.every((x) => typeof x === 'string')) return null;
    return ids.slice(0, 500); // sanity cap
  } catch {
    return null;
  }
}

/** Plain-file export for the settings-minded. */
export async function bookmarksToJsonBlob(): Promise<Blob> {
  const ids = await getBookmarkIds();
  return new Blob(
    [JSON.stringify({ version: 1, exported: new Date().toISOString(), bookmarks: ids }, null, 2)],
    { type: 'application/json' }
  );
}
