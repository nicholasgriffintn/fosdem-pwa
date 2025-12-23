import { github } from "~/server/auth";
import type { GitHubUser, OAuthUser } from "~/types/user";

export class GitHubOAuthHandler {
	async createAuthUrl(): Promise<URL> {
		const state = crypto.randomUUID();
		return github.createAuthorizationURL(state, ["user:email"]);
	}

	async handleCallback(code: string, _state: string): Promise<OAuthUser> {
		const tokens = await github.validateAuthorizationCode(code);

		if (!tokens.accessToken()) {
			throw new Error("GitHub Callback: No access token found");
		}

		const githubUserResponse = await fetch(
			"https://api.github.com/user",
			{
				headers: {
					Authorization: `Bearer ${tokens.accessToken()}`,
					Accept: "application/json",
					"User-Agent": "Fosdem PWA",
				},
			},
		);

		if (!githubUserResponse.ok) {
			const errorText = await githubUserResponse.text();

			console.error("GitHub Callback: API Error:", {
				status: githubUserResponse.status,
				statusText: githubUserResponse.statusText,
				body: errorText,
			});

			throw new Error(
				`GitHub Callback: API Error: ${githubUserResponse.status} ${githubUserResponse.statusText}`,
			);
		}

		const githubUser: GitHubUser = await githubUserResponse.json();

		if (!githubUser.id) {
			throw new Error(
				"GitHub Callback: No user ID found in GitHub response",
			);
		}

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
