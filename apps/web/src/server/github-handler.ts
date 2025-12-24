import { github } from "~/server/auth";
import type { GitHubUser, OAuthUser } from "~/types/user";
import {
	type OAuthHandler,
	fetchOAuthUserData,
	validateAccessToken,
	validateUserId,
} from "~/server/lib/oauth-handler-base";

const PROVIDER_NAME = "GitHub";
const API_URL = "https://api.github.com/user";

export class GitHubOAuthHandler implements OAuthHandler {
	async createAuthUrl(): Promise<URL> {
		const state = crypto.randomUUID();
		return github.createAuthorizationURL(state, ["user:email"]);
	}

	async handleCallback(code: string, _state: string): Promise<OAuthUser> {
		const tokens = await github.validateAuthorizationCode(code);
		const accessToken = validateAccessToken(PROVIDER_NAME, tokens);

		const githubUser = await fetchOAuthUserData<GitHubUser>(
			PROVIDER_NAME,
			API_URL,
			accessToken,
			{ "User-Agent": "Fosdem PWA" },
		);

		validateUserId(PROVIDER_NAME, githubUser.id);

		return {
			id: githubUser.id,
			email: githubUser.email || `${githubUser.id}+${githubUser.login}@users.noreply.github.com`,
			name: githubUser.name || githubUser.login,
			avatar_url: githubUser.avatar_url,
			login: githubUser.login,
			company: githubUser.company,
			blog: githubUser.blog,
			location: githubUser.location,
			bio: githubUser.bio,
			twitter_username: githubUser.twitter_username,
		};
	}
}
