const DB_NAME = 'zemenpix-pro';
const DB_VERSION = 1;

interface ProcessedImage {
  id?: number;
  filename: string;
  originalSize: number;
  compressedSize: number;
  format: string;
  action: 'compress' | 'upscale' | 'convert' | 'sharpen' | 'denoise' | 'crop' | 'rotate' | 'brightness' | 'contrast' | 'saturation' | 'watermark' | 'batch';
  timestamp: number;
}

interface UserPreferences {
  id: string;
  defaultQuality: number;
  defaultFormat: string;
  autoDownload: boolean;
  sharpenEnabled: boolean;
}

let dbInstance: IDBDatabase | null = null;

export async function getDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('history')) {
        const historyStore = db.createObjectStore('history', { keyPath: 'id', autoIncrement: true });
        historyStore.createIndex('timestamp', 'timestamp', { unique: false });
        historyStore.createIndex('action', 'action', { unique: false });
      }

      if (!db.objectStoreNames.contains('preferences')) {
        db.createObjectStore('preferences', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('cache')) {
        db.createObjectStore('cache', { keyPath: 'id' });
      }
    };
  });
}

export async function addToHistory(item: Omit<ProcessedImage, 'id'>): Promise<number> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('history', 'readwrite');
    const store = tx.objectStore('history');
    const request = store.add(item);
    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
}

export async function getHistory(limit = 50): Promise<ProcessedImage[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('history', 'readonly');
    const store = tx.objectStore('history');
    const index = store.index('timestamp');
    const request = index.openCursor(null, 'prev');
    const results: ProcessedImage[] = [];
    
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor && results.length < limit) {
        results.push(cursor.value);
        cursor.continue();
      } else {
        resolve(results);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

export async function clearHistory(): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('history', 'readwrite');
    const store = tx.objectStore('history');
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getPreferences(): Promise<UserPreferences | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('preferences', 'readonly');
    const store = tx.objectStore('preferences');
    const request = store.get('user-prefs');
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function savePreferences(prefs: Omit<UserPreferences, 'id'>): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('preferences', 'readwrite');
    const store = tx.objectStore('preferences');
    const request = store.put({ id: 'user-prefs', ...prefs });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getHistoryStats(): Promise<{ totalProcessed: number; totalSaved: number }> {
  const history = await getHistory(1000);
  const totalProcessed = history.length;
  const totalSaved = history.reduce((acc, item) => acc + (item.originalSize - item.compressedSize), 0);
  return { totalProcessed, totalSaved };
}
