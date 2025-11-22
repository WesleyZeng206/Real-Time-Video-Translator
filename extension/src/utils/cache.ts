import { TranscriptionSegment } from '../types';

const DB_NAME = 'VideoTranslatorCache';
const DB_VERSION = 1;
const STORE = 'translations';

interface CachedTranslation {
  videoId: string;
  languages: {
    [lang: string]: {
      original: TranscriptionSegment[];
      translation: TranscriptionSegment[];
      timestamp: number;
    };
  };
  videoUrl: string;
  cachedAt: number;
}

class CacheManager {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onerror = () => reject(req.error);
      req.onsuccess = () => {
        this.db = req.result;
        resolve();
      };

      req.onupgradeneeded = (e) => {
        const d = (e.target as IDBOpenDBRequest).result;
        if (!d.objectStoreNames.contains(STORE)) {
          const s = d.createObjectStore(STORE, { keyPath: 'videoId' });
          s.createIndex('cachedAt', 'cachedAt', { unique: false });
        }
      };
    });
  }

  private extractVideoId(url: string): string | null {
    let m = url.match(/[?&]v=([^&]+)/);
    if (m) return `yt_${m[1]}`;

    m = url.match(/netflix\.com\/watch\/(\d+)/);
    if (m) return `nf_${m[1]}`;

    m = url.match(/amazon\.com\/.*\/([A-Z0-9]+)/);
    if (m) return `prime_${m[1]}`;

    m = url.match(/twitch\.tv\/videos\/(\d+)/);
    if (m) return `twitch_${m[1]}`;

    return `other_${this.hashCode(url)}`;
  }

  private hashCode(s: string): string {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      const c = s.charCodeAt(i);
      h = ((h << 5) - h) + c;
      h = h & h;
    }
    return Math.abs(h).toString(36);
  }

  async getCachedTranslation(
    url: string,
    lang: string
  ): Promise<{ original: TranscriptionSegment[]; translation: TranscriptionSegment[] } | null> {
    if (!this.db) await this.init();

    const id = this.extractVideoId(url);
    if (!id) return null;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([STORE], 'readonly');
      const st = tx.objectStore(STORE);
      const req = st.get(id);

      req.onerror = () => reject(req.error);
      req.onsuccess = () => {
        const c = req.result as CachedTranslation | undefined;
        if (c && c.languages[lang]) {
          const d = c.languages[lang];
          const valid = Date.now() - d.timestamp < 30 * 24 * 60 * 60 * 1000;
          if (valid) {
            resolve({
              original: d.original,
              translation: d.translation
            });
          } else {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      };
    });
  }

  async saveTranslation(
    url: string,
    lang: string,
    original: TranscriptionSegment[],
    translation: TranscriptionSegment[]
  ): Promise<void> {
    if (!this.db) await this.init();

    const id = this.extractVideoId(url);
    if (!id) return;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([STORE], 'readwrite');
      const st = tx.objectStore(STORE);

      const req = st.get(id);

      req.onsuccess = () => {
        const existing = req.result as CachedTranslation | undefined;

        const c: CachedTranslation = existing || {
          videoId: id,
          languages: {},
          videoUrl: url,
          cachedAt: Date.now()
        };

        c.languages[lang] = {
          original,
          translation,
          timestamp: Date.now()
        };

        const put = st.put(c);
        put.onerror = () => reject(put.error);
        put.onsuccess = () => resolve();
      };

      req.onerror = () => reject(req.error);
    });
  }

  async clearCache(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([STORE], 'readwrite');
      const st = tx.objectStore(STORE);
      const req = st.clear();

      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve();
    });
  }

  async getCacheSize(): Promise<number> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([STORE], 'readonly');
      const st = tx.objectStore(STORE);
      const req = st.count();

      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(req.result);
    });
  }
}

export const cacheManager = new CacheManager();
