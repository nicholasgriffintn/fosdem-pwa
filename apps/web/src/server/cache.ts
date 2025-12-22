import { env } from "cloudflare:workers";

interface InMemoryCacheEntry {
	data: unknown;
	expiresAt: number;
}

export class CacheManager {
	private kvCache: KVNamespace | null;
	private memoryCache: Map<string, InMemoryCacheEntry> = new Map();
	private readonly PREFIX = "fosdem:";
	private readonly TTL = 60 * 60 * 24; // 24 hours in seconds

	constructor() {
		if (
			env.KV_CACHING_ENABLED === "true" &&
			env.KV
		) {
			this.kvCache = env.KV;
		} else {
			this.kvCache = null;
		}
	}

	private getKey(key: string): string {
		return `${this.PREFIX}${key}`;
	}

	async get(key: string) {
		const prefixedKey = this.getKey(key);

		if (this.kvCache) {
			try {
				const data = await this.kvCache.get(this.getKey(key));
				if (data === null || data === undefined) {
					return null;
				}
				if (typeof data === "string") {
					try {
						return JSON.parse(data);
					} catch (error) {
						return data;
					}
				}
				return data;
			} catch (error) {
				console.error(`KV get error for key ${key}:`, error);
				return null;
			}
		}

		const entry = this.memoryCache.get(prefixedKey);

		if (!entry) {
			return null;
		}

		if (Date.now() > entry.expiresAt) {
			this.memoryCache.delete(prefixedKey);
			return null;
		}

		return entry.data;
	}

	async set(key: string, data: unknown, ttl?: number) {
		const prefixedKey = this.getKey(key);
		const effectiveTtl = ttl || this.TTL;

		if (this.kvCache) {
			try {
				const stringData = typeof data === "string" ? data : JSON.stringify(data);
				await this.kvCache.put(this.getKey(key), stringData, { expirationTtl: ttl || this.TTL });
			} catch (error) {
				console.error(`KV set error for key ${key}:`, error);
			}
		}

		const expiresAt = Date.now() + effectiveTtl * 1000;
		this.memoryCache.set(prefixedKey, { data, expiresAt });
	}

	async invalidate(key: string) {
		const prefixedKey = this.getKey(key);

		if (this.memoryCache.has(prefixedKey)) {
			this.memoryCache.delete(prefixedKey);
		}

		if (!this.kvCache) {
			return;
		}

		try {
			await this.kvCache.delete(this.getKey(key));
		} catch (error) {
			console.error(`KV invalidate error for key ${key}:`, error);
		}
	}
}
