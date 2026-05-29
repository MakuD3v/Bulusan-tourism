/**
 * IndexedDB Utility for Bulusan Tourism Platform
 * Used to handle large data sets (like 5-minute videos and high-res photos)
 * when Firebase is not configured.
 */

const DB_NAME = 'BulusanTourismDB_v2'; 
const DB_VERSION = 4; // Bumped for bookings and curatedRoutes

export const idbService = {
  db: null as IDBDatabase | null,
  initPromise: null as Promise<IDBDatabase> | null,

  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      console.log('Initializing IndexedDB...');
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        console.log('Upgrading IndexedDB stores...');
        const stores = ['attractions', 'enterprises', 'heritage', 'blogs', 'inquiries', 'users', 'media', 'global_stats', 'userTours', 'bookings', 'curatedRoutes'];
        
        stores.forEach(store => {
          if (!db.objectStoreNames.contains(store)) {
            db.createObjectStore(store, { keyPath: 'id' });
          }
        });
      };

      request.onsuccess = (event: any) => {
        this.db = event.target.result;
        console.log('IndexedDB initialized successfully.');
        
        // Resolve immediately to let the app start
        resolve(this.db!);

        // handle migration in background
        this._migrateLegacyData();
      };

      request.onerror = (event: any) => {
        console.error('IndexedDB initialization failed:', event.target.error);
        this.initPromise = null;
        reject(event.target.error);
      };

      request.onblocked = () => {
        console.warn('IndexedDB initialization blocked. Please close other tabs of this app.');
      };

      // Safety timeout
      setTimeout(() => {
        if (!this.db) {
          console.warn('IndexedDB initialization timed out. Proceeding in limited mode.');
          resolve(null as any);
        }
      }, 5000);
    });

    return this.initPromise;
  },

  async _migrateLegacyData() {
    if (!this.db || !this.db.objectStoreNames.contains('accomodities')) return;

    try {
      console.log('Starting legacy data migration...');
      const legacyData = await new Promise<any[]>((res, rej) => {
        const transaction = this.db!.transaction('accomodities', 'readonly');
        const store = transaction.objectStore('accomodities');
        const request = store.getAll();
        request.onsuccess = () => res(request.result);
        request.onerror = () => rej(request.error);
      });

      if (legacyData.length > 0) {
        console.log(`Migrating ${legacyData.length} items to enterprises...`);
        await new Promise<void>((res, rej) => {
          const transaction = this.db!.transaction('enterprises', 'readwrite');
          const store = transaction.objectStore('enterprises');
          legacyData.forEach(item => store.put(item));
          transaction.oncomplete = () => res();
          transaction.onerror = () => rej(transaction.error);
        });
        console.log('Migration complete.');
      }
      
      const clearTx = this.db!.transaction('accomodities', 'readwrite');
      clearTx.objectStore('accomodities').clear();
      console.log('Legacy accomodities store cleared.');
    } catch (e) {
      console.error('Background migration failed:', e);
    }
  },

  async getAll(storeName: string): Promise<any[]> {
    try {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.error(`Error getting all from ${storeName}:`, err);
      return [];
    }
  },

  async get(storeName: string, id: string): Promise<any | null> {
    try {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.error(`Error getting ${id} from ${storeName}:`, err);
      return null;
    }
  },

  async put(storeName: string, item: any): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async delete(storeName: string, id: string): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async saveMedia(path: string, blob: Blob): Promise<string> {
    try {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction('media', 'readwrite');
        const store = transaction.objectStore('media');
        const request = store.put({ id: path, blob });
        request.onsuccess = () => {
          // In Demo mode, we use Object URLs. 
          // Note: These are temporary and will break on refresh unless we resolve them again.
          resolve(URL.createObjectURL(blob));
        };
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.error('Error in saveMedia:', err);
      throw err;
    }
  },

  async getMedia(path: string): Promise<string | null> {
    const db = await this.init();
    return new Promise((resolve) => {
      const transaction = db.transaction('media', 'readonly');
      const store = transaction.objectStore('media');
      const request = store.get(path);
      request.onsuccess = () => {
        if (request.result) {
          resolve(URL.createObjectURL(request.result.blob));
        } else {
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    });
  }
};
