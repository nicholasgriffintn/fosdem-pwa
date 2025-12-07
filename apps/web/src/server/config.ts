import { env } from "cloudflare:workers";

export function getCloudflareEnv() {
	try {
		const AUTH_REDIRECT_URL = env.GITHUB_REDIRECT_URI
			? env.GITHUB_REDIRECT_URI
			: `${env.CF_PAGES_URL}/api/auth/callback/github`;

		const envVars = {
			CLOUDFLARE_ACCOUNT_ID: env.CLOUDFLARE_ACCOUNT_ID,
			CLOUDFLARE_DATABASE_ID: env.CLOUDFLARE_DATABASE_ID,
			CLOUDFLARE_D1_TOKEN: env.CLOUDFLARE_D1_TOKEN,
			REDIS_ENABLED: env.REDIS_ENABLED,
			UPSTASH_REDIS_URL: env.UPSTASH_REDIS_URL,
			UPSTASH_REDIS_TOKEN: env.UPSTASH_REDIS_TOKEN,
			NODE_ENV: env.NODE_ENV,
			GITHUB_CLIENT_ID: env.GITHUB_CLIENT_ID,
			GITHUB_CLIENT_SECRET: env.GITHUB_CLIENT_SECRET,
			GITHUB_REDIRECT_URI: AUTH_REDIRECT_URL,
		};

		return envVars;
	} catch (error) {
		console.warn("Failed to get Cloudflare context:", error);
		return process.env;
	}
}
