// lib/ai/cache.ts

/** Simple in-memory cache with TTL */
interface CacheEntry<T> {
  value: T;
  expiresAt: number; // timestamp in ms
}

class MemoryCache<T> {
  private store = new Map<string, CacheEntry<T>>();

  constructor(private defaultTtlMs: number = 10 * 60 * 1000) {}

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T, ttlMs?: number): void {
    const expiresAt = Date.now() + (ttlMs ?? this.defaultTtlMs);
    this.store.set(key, { value, expiresAt });
  }

  delete(key: string) {
    this.store.delete(key);
  }
}

export const aiCache = new MemoryCache<any>(
  Number(process.env.AI_CACHE_TTL_MS) || 10 * 60 * 1000
);
