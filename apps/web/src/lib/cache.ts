import { Redis } from "@upstash/redis";

import { getCloudflareEnv } from "~/server/config";

interface InMemoryCacheEntry {
	data: unknown;
	expiresAt: number;
}

export class CacheManager {
	private redis: Redis | null;
	private memoryCache: Map<string, InMemoryCacheEntry>;
	private readonly PREFIX = "fosdem:";
	private readonly TTL = 60 * 60 * 24;

	constructor() {
		const env = getCloudflareEnv();

		if (
			env.REDIS_ENABLED === "true" &&
			env.UPSTASH_REDIS_URL &&
			env.UPSTASH_REDIS_TOKEN
		) {
			this.redis = new Redis({
				url: env.UPSTASH_REDIS_URL,
				token: env.UPSTASH_REDIS_TOKEN,
			});
			this.memoryCache = new Map();
		} else {
			this.redis = null;
			this.memoryCache = new Map();
		}
	}

	private getKey(key: string): string {
		return `${this.PREFIX}${key}`;
	}

	async get(key: string) {
		const prefixedKey = this.getKey(key);

		if (this.redis) {
			try {
				const data = await this.redis.get(prefixedKey);
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
				console.error(`Redis get error for key ${key}:`, error);
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

		if (this.redis) {
			try {
				const stringData = typeof data === "string" ? data : JSON.stringify(data);
				await this.redis.set(prefixedKey, stringData, { ex: effectiveTtl });
			} catch (error) {
				console.error(`Redis set error for key ${key}:`, error);
			}
		}

		this.memoryCache.set(prefixedKey, {
			data,
			expiresAt: Date.now() + effectiveTtl * 1000,
		});
	}

	async invalidate(key: string) {
		const prefixedKey = this.getKey(key);

		if (this.redis) {
			try {
				await this.redis.del(prefixedKey);
			} catch (error) {
				console.error(`Redis invalidate error for key ${key}:`, error);
			}
		}

		this.memoryCache.delete(prefixedKey);
	}
}
