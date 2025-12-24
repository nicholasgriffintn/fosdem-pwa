import { gitlab } from "~/server/auth";
import type { OAuthUser } from "~/types/user";
import type { GitLabUser } from "~/types/gitlab";
import {
	type OAuthHandler,
	fetchOAuthUserData,
	validateAccessToken,
	validateUserId,
} from "~/server/lib/oauth-handler-base";

const PROVIDER_NAME = "GitLab";
const API_URL = "https://gitlab.com/api/v4/user";

export class GitLabOAuthHandler implements OAuthHandler {
	async createAuthUrl(): Promise<URL> {
		const state = crypto.randomUUID();
		return gitlab.createAuthorizationURL(state, ["read_user", "profile"]);
	}

	async handleCallback(code: string, _state: string): Promise<OAuthUser> {
		const tokens = await gitlab.validateAuthorizationCode(code);
		const accessToken = validateAccessToken(PROVIDER_NAME, tokens);

		const gitlabUser = await fetchOAuthUserData<GitLabUser>(
			PROVIDER_NAME,
			API_URL,
			accessToken,
			{ "User-Agent": "Fosdem PWA" },
		);

		validateUserId(PROVIDER_NAME, gitlabUser.id);

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
