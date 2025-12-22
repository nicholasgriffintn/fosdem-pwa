import { Redis } from "@upstash/redis";

import { getCloudflareEnv } from "~/server/config";

export class CacheManager {
	private redis: Redis | null;
	private readonly PREFIX = "fosdem:";
	private readonly TTL = 60 * 60 * 24; // 24 hours in seconds

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
		} else {
			this.redis = null;
		}
	}

	private getKey(key: string): string {
		return `${this.PREFIX}${key}`;
	}

	async get(key: string) {
		if (!this.redis) {
			return null;
		}

		try {
			const data = await this.redis.get(this.getKey(key));
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
			return null;
		}
	}

	async set(key: string, data: unknown, ttl?: number) {
		if (!this.redis) {
			return;
		}

		try {
			const stringData = typeof data === "string" ? data : JSON.stringify(data);
			await this.redis.set(this.getKey(key), stringData, { ex: ttl || this.TTL });
		} catch (error) {
			console.error(`Redis set error for key ${key}:`, error);
		}
	}

	async invalidate(key: string) {
		if (!this.redis) {
			return;
		}

		try {
			await this.redis.del(this.getKey(key));
		} catch (error) {
			console.error(`Redis invalidate error for key ${key}:`, error);
		}
	}
}
