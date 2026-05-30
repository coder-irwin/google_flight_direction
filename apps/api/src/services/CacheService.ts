import * as admin from 'firebase-admin';

class CacheService {
  private useFirestore = false;
  private memoryCache = new Map<string, { data: any, expiresAt: number }>();
  private db: admin.firestore.Firestore | null = null;

  constructor() {
    if (process.env.FIRESTORE_PROJECT_ID) {
      try {
        admin.initializeApp({
          projectId: process.env.FIRESTORE_PROJECT_ID
        });
        this.db = admin.firestore();
        this.useFirestore = true;
        console.log('Firestore Cache initialized');
      } catch (error) {
        console.warn('Failed to initialize Firestore, falling back to memory cache', error);
      }
    } else {
      console.log('No FIRESTORE_PROJECT_ID provided, using in-memory cache');
    }
  }

  public async get<T>(key: string, collectionName: string = 'cache'): Promise<T | null> {
    if (this.useFirestore && this.db) {
      try {
        const doc = await this.db.collection(collectionName).doc(key).get();
        if (doc.exists) {
          const data = doc.data();
          if (data && data.expiresAt > Date.now()) {
            return data.value as T;
          }
        }
      } catch (error) {
        console.error(`Firestore get error for key ${key}:`, error);
      }
      return null;
    } else {
      const cached = this.memoryCache.get(`${collectionName}_${key}`);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.data as T;
      }
      return null;
    }
  }

  public async set<T>(key: string, value: T, ttlSeconds: number, collectionName: string = 'cache'): Promise<void> {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    
    if (this.useFirestore && this.db) {
      try {
        await this.db.collection(collectionName).doc(key).set({
          value,
          expiresAt
        });
      } catch (error) {
        console.error(`Firestore set error for key ${key}:`, error);
      }
    } else {
      this.memoryCache.set(`${collectionName}_${key}`, { data: value, expiresAt });
    }
  }
}

export const cacheService = new CacheService();
