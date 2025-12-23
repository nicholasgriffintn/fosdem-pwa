import { gitlab } from "~/server/auth";
import type { OAuthUser } from "~/types/user";

export class GitLabOAuthHandler {
	async createAuthUrl(): Promise<URL> {
		const state = crypto.randomUUID();
		return gitlab.createAuthorizationURL(state, ["read_user", "profile"]);
	}

	async handleCallback(code: string, _state: string): Promise<OAuthUser> {
		const tokens = await gitlab.validateAuthorizationCode(code);

		if (!tokens.accessToken()) {
			throw new Error("GitLab Callback: No access token found");
		}

		const gitlabUserResponse = await fetch(
			"https://gitlab.com/api/v4/user",
			{
				headers: {
					Authorization: `Bearer ${tokens.accessToken()}`,
					Accept: "application/json",
					"User-Agent": "Fosdem PWA",
				},
			},
		);

		if (!gitlabUserResponse.ok) {
			const errorText = await gitlabUserResponse.text();

			console.error("GitLab Callback: API Error:", {
				status: gitlabUserResponse.status,
				statusText: gitlabUserResponse.statusText,
				body: errorText,
			});

			throw new Error(
				`GitLab Callback: API Error: ${gitlabUserResponse.status} ${gitlabUserResponse.statusText}`,
			);
		}

		const gitlabUser: any = await gitlabUserResponse.json();

		if (!gitlabUser.id) {
			throw new Error(
				"GitLab Callback: No user ID found in GitLab response",
			);
		}

		return {
			id: gitlabUser.id.toString(),
			email: gitlabUser.email || `${gitlabUser.id}+${gitlabUser.username}@users.noreply.gitlab.com`,
			name: gitlabUser.name || gitlabUser.username,
			avatar_url: gitlabUser.avatar_url,
			username: gitlabUser.username,
			bio: gitlabUser.bio,
			location: gitlabUser.location,
			blog: gitlabUser.website_url,
		};
	}
}
