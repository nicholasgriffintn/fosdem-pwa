import { discord } from "~/server/auth";
import type { DiscordUser, OAuthUser } from "~/types/user";

export class DiscordOAuthHandler {
	async createAuthUrl(): Promise<URL> {
		const state = crypto.randomUUID();
		return discord.createAuthorizationURL(state, null, ["identify", "email"]);
	}

	async handleCallback(code: string, _state: string): Promise<OAuthUser> {
		const tokens = await discord.validateAuthorizationCode(code, null);

		if (!tokens.accessToken()) {
			throw new Error("Discord Callback: No access token found");
		}

		const discordUserResponse = await fetch("https://discord.com/api/users/@me", {
			headers: {
				Authorization: `Bearer ${tokens.accessToken()}`,
			},
		});

		if (!discordUserResponse.ok) {
			const errorText = await discordUserResponse.text();

			console.error("Discord Callback: API Error:", {
				status: discordUserResponse.status,
				statusText: discordUserResponse.statusText,
				body: errorText,
			});

			throw new Error(
				`Discord Callback: API Error: ${discordUserResponse.status} ${discordUserResponse.statusText}`,
			);
		}

		const discordUser: DiscordUser = await discordUserResponse.json();

		if (!discordUser.id) {
			throw new Error("Discord Callback: No user ID found in Discord response");
		}

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
