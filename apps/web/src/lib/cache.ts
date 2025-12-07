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

		const data = await this.redis.get(this.getKey(key));
		try {
			return JSON.parse(data as string);
		} catch (error) {
			return data;
		}
	}

	async set(key: string, data: any, ttl?: number) {
		if (!this.redis) {
			return;
		}

		const stringData = typeof data === "string" ? data : JSON.stringify(data);
		await this.redis.set(this.getKey(key), stringData, { ex: ttl || this.TTL });
	}

	async invalidate(key: string) {
		if (!this.redis) {
			return;
		}

		await this.redis.del(this.getKey(key));
	}
}
