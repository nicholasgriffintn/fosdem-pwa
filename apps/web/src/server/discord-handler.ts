import { discord } from "~/server/auth";
import type { DiscordUser, OAuthUser } from "~/types/user";
import {
	type OAuthHandler,
	fetchOAuthUserData,
	validateAccessToken,
	validateUserId,
} from "~/server/lib/oauth-handler-base";

const PROVIDER_NAME = "Discord";
const API_URL = "https://discord.com/api/users/@me";

export class DiscordOAuthHandler implements OAuthHandler {
	async createAuthUrl(): Promise<URL> {
		const state = crypto.randomUUID();
		return discord.createAuthorizationURL(state, null, ["identify", "email"]);
	}

	async handleCallback(code: string, _state: string): Promise<OAuthUser> {
		const tokens = await discord.validateAuthorizationCode(code, null);
		const accessToken = validateAccessToken(PROVIDER_NAME, tokens);

		const discordUser = await fetchOAuthUserData<DiscordUser>(
			PROVIDER_NAME,
			API_URL,
			accessToken,
		);

		validateUserId(PROVIDER_NAME, discordUser.id);

		if (!discordUser.verified) {
			throw new Error("Discord Callback: User email is not verified");
		}

		const avatarUrl = discordUser.avatar_url
			? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar_url}.png`
			: `https://cdn.discordapp.com/embed/avatars/0.png`;

		return {
			id: discordUser.id,
			email: discordUser.email,
			name: discordUser.global_name || discordUser.username,
			avatar_url: avatarUrl,
			username: discordUser.username,
			discriminator: discordUser.discriminator,
		};
	}
}
