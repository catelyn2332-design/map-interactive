const IDB_NAME = "atlas-bellarosa";
const IDB_VERSION = 2;

export const IDB_CATALOG = "catalog";
export const IDB_PREFS = "prefs";

export function openAtlasDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_NAME, IDB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_CATALOG)) {
          db.createObjectStore(IDB_CATALOG);
        }
        if (!db.objectStoreNames.contains(IDB_PREFS)) {
          db.createObjectStore(IDB_PREFS);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export function putCatalog(key: string, value: unknown) {
  void openAtlasDb().then((db) => {
    if (!db) return;
    try {
      db.transaction(IDB_CATALOG, "readwrite")
        .objectStore(IDB_CATALOG)
        .put(value, key);
    } catch {
      /* quota / closed */
    }
  });
}

export function getCatalog(key: string): Promise<unknown | null> {
  return openAtlasDb().then(
    (db) =>
      new Promise((resolve) => {
        if (!db) {
          resolve(null);
          return;
        }
        try {
          const req = db
            .transaction(IDB_CATALOG, "readonly")
            .objectStore(IDB_CATALOG)
            .get(key);
          req.onsuccess = () => resolve(req.result ?? null);
          req.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      }),
  );
}
