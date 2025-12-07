export function getCloudflareEnv() {
	try {
		const AUTH_REDIRECT_URL = process.env.GITHUB_REDIRECT_URI
			? process.env.GITHUB_REDIRECT_URI
			: `${process.env.CF_PAGES_URL}/api/auth/callback/github`;

		const envVars = {
			CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
			CLOUDFLARE_DATABASE_ID: process.env.CLOUDFLARE_DATABASE_ID,
			CLOUDFLARE_D1_TOKEN: process.env.CLOUDFLARE_D1_TOKEN,
			REDIS_ENABLED: process.env.REDIS_ENABLED,
			UPSTASH_REDIS_URL: process.env.UPSTASH_REDIS_URL,
			UPSTASH_REDIS_TOKEN: process.env.UPSTASH_REDIS_TOKEN,
			NODE_ENV: process.env.NODE_ENV,
			GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
			GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
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
