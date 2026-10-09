const DATABASE_NAME = 'dalelak-directory';
const STORE_NAME = 'catalog-cache';
const CATALOG_KEY = 'public-catalog';
const LEGACY_KEY = 'dalelak_directory_cache';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB unavailable'));
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Unable to open catalog cache'));
  });
}

function readLegacyCatalog(): unknown[] | null {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function readCatalogCache(): Promise<unknown[] | null> {
  try {
    const db = await openDatabase();
    const stored = await new Promise<unknown>((resolve, reject) => {
      const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(CATALOG_KEY);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    db.close();
    if (Array.isArray(stored)) return stored;
    const legacy = readLegacyCatalog();
    if (legacy) await writeCatalogCache(legacy);
    return legacy;
  } catch {
    return readLegacyCatalog();
  }
}

export async function writeCatalogCache(catalog: unknown[]): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(catalog, CATALOG_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Unable to persist catalog'));
      tx.onabort = () => reject(tx.error || new Error('Catalog cache write aborted'));
    });
    db.close();
  } catch {
    try { localStorage.setItem(LEGACY_KEY, JSON.stringify(catalog)); } catch {}
  }
}
