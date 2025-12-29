import { env } from "cloudflare:workers";
import { CONSTANTS } from "~/server/constants";
import { LRUCache } from "~/server/lib/lru-cache";

export class CacheManager {
	private static instance: CacheManager | null = null;

	private kvCache: KVNamespace | null = null;
	private memoryCache!: LRUCache;
	private readonly PREFIX = "fosdem:";
	private readonly TTL = CONSTANTS.DEFAULT_TTL;
	private readonly MAX_MEMORY_ENTRIES = 1000;
	private lastCleanup = 0;
	private readonly CLEANUP_INTERVAL = 5 * 60 * 1000;

	constructor() {
		if (CacheManager.instance) {
			return CacheManager.instance;
		}

		if (
			env.KV_CACHING_ENABLED === "true" &&
			env.KV
		) {
			this.kvCache = env.KV;
		}

		this.memoryCache = new LRUCache(this.MAX_MEMORY_ENTRIES);
		CacheManager.instance = this;
	}

	static getInstance(): CacheManager {
		if (!CacheManager.instance) {
			CacheManager.instance = new CacheManager();
		}
		return CacheManager.instance;
	}

	static resetInstance(): void {
		CacheManager.instance = null;
	}

	private maybeCleanup(): void {
		const now = Date.now();
		if (now - this.lastCleanup > this.CLEANUP_INTERVAL) {
			this.memoryCache.cleanup();
			this.lastCleanup = now;
		}
	}

	private getKey(key: string): string {
		return `${this.PREFIX}${key}`;
	}

	async get(key: string) {
		this.maybeCleanup();
		const prefixedKey = this.getKey(key);

		if (this.kvCache) {
			try {
				const data = await this.kvCache.get(prefixedKey);
				if (data === null || data === undefined) {
					return null;
				}
				if (typeof data === "string" && (data.startsWith('{') || data.startsWith('['))) {
					try {
						return JSON.parse(data);
					} catch (error) {
						console.error(`JSON parse error for key ${key}:`, error);
						await this.kvCache.delete(prefixedKey);
						return null;
					}
				}
				return data;
			} catch (error) {
				console.error(`KV get error for key ${key}:`, error);
				return null;
			}
		}

		const entry = this.memoryCache.get(prefixedKey);
		return entry ? entry.data : null;
	}

	async set(key: string, data: unknown, ttl?: number) {
		const prefixedKey = this.getKey(key);
		const effectiveTtl = ttl || this.TTL;
		const expiresAt = Date.now() + effectiveTtl * 1000;

		if (this.kvCache) {
			try {
				const stringData = typeof data === "string" ? data : JSON.stringify(data);
				await this.kvCache.put(prefixedKey, stringData, { expirationTtl: effectiveTtl });
				this.memoryCache.set(prefixedKey, { data, expiresAt });
			} catch (error) {
				console.error(`KV set error for key ${key}:`, error);
				this.memoryCache.delete(prefixedKey);
			}
		} else {
			this.memoryCache.set(prefixedKey, { data, expiresAt });
		}
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
			await this.kvCache.delete(prefixedKey);
		} catch (error) {
			console.error(`KV invalidate error for key ${key}:`, error);
		}
	}

}
