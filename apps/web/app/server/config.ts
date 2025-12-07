import { getContext } from "vinxi/http";

export function getCloudflareEnv() {
	try {
		const cf = getContext("cloudflare");
		if (!cf) {
			return process.env;
		}

		const AUTH_REDIRECT_URL = cf.env.GITHUB_REDIRECT_URI
			? cf.env.GITHUB_REDIRECT_URI
			: `${cf.env.CF_PAGES_URL}/api/auth/callback/github`;

		const envVars = {
			CLOUDFLARE_ACCOUNT_ID: cf.env.CLOUDFLARE_ACCOUNT_ID,
			CLOUDFLARE_DATABASE_ID: cf.env.CLOUDFLARE_DATABASE_ID,
			CLOUDFLARE_D1_TOKEN: cf.env.CLOUDFLARE_D1_TOKEN,
			REDIS_ENABLED: cf.env.REDIS_ENABLED,
			UPSTASH_REDIS_URL: cf.env.UPSTASH_REDIS_URL,
			UPSTASH_REDIS_TOKEN: cf.env.UPSTASH_REDIS_TOKEN,
			NODE_ENV: cf.env.NODE_ENV,
			GITHUB_CLIENT_ID: cf.env.GITHUB_CLIENT_ID,
			GITHUB_CLIENT_SECRET: cf.env.GITHUB_CLIENT_SECRET,
			GITHUB_REDIRECT_URI: AUTH_REDIRECT_URL,
		};

		for (const [key, value] of Object.entries(envVars)) {
			if (value && !process.env[key]) {
				process.env[key] = value;
			}
		}

		return process.env;
	} catch (error) {
		console.warn("Failed to get Cloudflare context:", error);
		return process.env;
	}
}
