import { env } from "cloudflare:workers";
import {
	AuthError,
	type AuthPlugin,
	type ExternalIdentity,
} from "@ngriffin_uk/auth-core";
import type {
	OAuthOperations,
	OAuthStateRecord,
	OAuthStateStore,
	OAuthTokenSet,
} from "@ngriffin_uk/auth-oauth2";
import { createDiscordAuth } from "@ngriffin_uk/auth-provider-discord";
import { createGitHubAuth } from "@ngriffin_uk/auth-provider-github";
import { createGitLabAuth } from "@ngriffin_uk/auth-provider-gitlab";
import { createMastodonAuth } from "@ngriffin_uk/auth-provider-mastodon";
import type { AuthClientResult, AuthRequest } from "@ngriffin_uk/auth-protocol";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";

import {
	auth,
	type FosdemAuthUser,
	getAuthSession,
	setSessionTokenCookie,
} from "~/server/auth";
import { db } from "~/server/db";
import { oauthState } from "~/server/db/schema";
import {
	authenticationFailureRedirect,
	redirectResponse,
} from "~/server/lib/auth-response";
import { fetchOAuthUserData } from "~/server/lib/oauth-handler-base";
import type { FosdemOAuthProvider } from "~/server/lib/oauth-provider";
import type { GitLabUser } from "~/types/gitlab";
import type {
	DiscordUser,
	GitHubUser,
	MastodonUser,
	OAuthUser,
} from "~/types/user";

export type { FosdemOAuthProvider } from "~/server/lib/oauth-provider";

export const MASTODON_INSTANCES = [
	{
		name: "mastodon.social",
		baseUrl: "https://mastodon.social",
		clientId: env.MASTODON_MASTODON_SOCIAL_CLIENT_ID,
		clientSecret: env.MASTODON_MASTODON_SOCIAL_CLIENT_SECRET,
	},
	{
		name: "mastodon.online",
		baseUrl: "https://mastodon.online",
		clientId: env.MASTODON_MASTODON_ONLINE_CLIENT_ID,
		clientSecret: env.MASTODON_MASTODON_ONLINE_CLIENT_SECRET,
	},
] as const;

const stateStore: OAuthStateStore = {
	async create(record) {
		await db.insert(oauthState).values({
			state_hash: record.stateHash,
			provider: record.provider,
			code_verifier: record.codeVerifier,
			nonce: record.nonce,
			redirect_uri: record.redirectUri,
			context: record.context ? { ...record.context } : undefined,
			created_at: record.createdAt.toISOString(),
			expires_at: record.expiresAt.toISOString(),
		});
	},
	async consumeByStateHash(stateHash) {
		const [record] = await db
			.delete(oauthState)
			.where(eq(oauthState.state_hash, stateHash))
			.returning();
		return record ? toOAuthState(record) : null;
	},
};

export async function startOAuth(
	provider: FosdemOAuthProvider,
	request: Request,
	options: {
		readonly mastodonServer?: string;
		readonly upgrade?: boolean;
	} = {},
): Promise<Response> {
	try {
		const result = await startOAuthResult(provider, options);
		return redirectResponse(result.url);
	} catch (cause) {
		logOAuthFailure("start", provider, cause);
		return authenticationFailureRedirect(request);
	}
}

export async function startOAuthResult(
	provider: FosdemOAuthProvider,
	options: {
		readonly mastodonServer?: string;
		readonly upgrade?: boolean;
	} = {},
): Promise<
	Extract<AuthClientResult, { readonly status: "redirect_required" }>
> {
	const mastodonBaseUrl =
		provider === "mastodon"
			? requireMastodonInstance(options.mastodonServer).baseUrl
			: undefined;
	if (mastodonBaseUrl) {
		setCookie("mastodon_instance", mastodonBaseUrl, oauthCookieOptions());
	}
	const context: Record<string, string> = {};
	if (options.upgrade) {
		const { user } = await getAuthSession({ refreshCookie: false });
		if (!user?.is_guest) {
			throw new AuthError("invalid_input", "A guest session is required.");
		}
		context.upgradeUserId = String(user.id);
	}
	const configured = auth.use(createProvider(provider, mastodonBaseUrl));
	const url = await configured.providers[provider].startAuthorization({
		scopes: providerScopes(provider),
		...(Object.keys(context).length > 0 ? { context } : {}),
	});
	return {
		status: "redirect_required",
		provider,
		url: url.toString(),
	};
}

export function oauthRequestOptions(
	request: Extract<AuthRequest, { readonly action: "start_oauth" }>,
): {
	readonly mastodonServer?: string;
	readonly upgrade?: boolean;
} {
	return {
		...(request.provider === "mastodon"
			? { mastodonServer: request.values?.server }
			: {}),
		...(request.values?.upgrade === "true" ? { upgrade: true } : {}),
	};
}

export async function completeOAuth(
	provider: FosdemOAuthProvider,
	request: Request,
): Promise<Response> {
	try {
		const url = new URL(request.url);
		const code = url.searchParams.get("code");
		const state = url.searchParams.get("state");
		if (!code || !state) {
			return authenticationFailureRedirect(request);
		}
		const mastodonBaseUrl =
			provider === "mastodon"
				? requireMastodonInstance(getCookie("mastodon_instance")).baseUrl
				: undefined;
		const configured = auth.use(createProvider(provider, mastodonBaseUrl));
		const result = await configured.providers[provider].completeAuthorization({
			code,
			state,
		});
		if (result.status !== "authenticated") {
			return authenticationFailureRedirect(request);
		}
		setSessionTokenCookie(result.session.token, result.session.expiresAt);
		return redirectResponse(new URL("/", request.url));
	} catch (cause) {
		logOAuthFailure("callback", provider, cause);
		return authenticationFailureRedirect(request);
	}
}

function logOAuthFailure(
	stage: "callback" | "start",
	provider: FosdemOAuthProvider,
	cause: unknown,
): void {
	console.error(`OAuth ${stage} failed for ${provider}.`, {
		code: cause instanceof AuthError ? cause.code : "unexpected_error",
	});
}

function createProvider(
	provider: FosdemOAuthProvider,
	mastodonBaseUrl?: string,
): AuthPlugin<
	FosdemOAuthProvider,
	OAuthOperations<FosdemAuthUser>,
	FosdemAuthUser
> {
	switch (provider) {
		case "github":
			return createGitHubAuth({
				clientId: env.GITHUB_CLIENT_ID,
				clientSecret: env.GITHUB_CLIENT_SECRET,
				redirectUri: redirectUri("github"),
				stateStore,
				resolveIdentity: resolveGitHubIdentity,
			});
		case "discord":
			return createDiscordAuth({
				clientId: env.DISCORD_CLIENT_ID,
				clientSecret: env.DISCORD_CLIENT_SECRET,
				redirectUri: redirectUri("discord"),
				stateStore,
				resolveIdentity: resolveDiscordIdentity,
			});
		case "gitlab":
			return createGitLabAuth("https://gitlab.com", {
				clientId: env.GITLAB_CLIENT_ID,
				clientSecret: env.GITLAB_CLIENT_SECRET,
				redirectUri: redirectUri("gitlab"),
				stateStore,
				resolveIdentity: resolveGitLabIdentity,
			});
		case "mastodon": {
			const instance = requireMastodonInstance(mastodonBaseUrl);
			return createMastodonAuth(instance.baseUrl, {
				clientId: instance.clientId,
				clientSecret: instance.clientSecret,
				redirectUri: redirectUri("mastodon"),
				stateStore,
				resolveIdentity: (tokens, _claims, context) =>
					resolveMastodonIdentity(instance.baseUrl, tokens, context),
			});
		}
	}
}

async function resolveGitHubIdentity(
	tokens: OAuthTokenSet,
	_claims: unknown,
	context: Readonly<Record<string, string>>,
): Promise<ExternalIdentity> {
	const profile = await fetchOAuthUserData<GitHubUser>(
		"GitHub",
		"https://api.github.com/user",
		tokens.accessToken,
		{ "User-Agent": "FOSDEM PWA" },
	);
	const emails = await fetchOAuthUserData<GitHubEmail[]>(
		"GitHub",
		"https://api.github.com/user/emails",
		tokens.accessToken,
		{ "User-Agent": "FOSDEM PWA" },
	);
	const selected =
		emails.find((email) => email.primary && email.verified) ??
		emails.find((email) => email.verified);
	const email =
		selected?.email ??
		`${profile.id}+${profile.login}@users.noreply.github.com`;
	return identity(
		"github",
		String(profile.id),
		{
			id: String(profile.id),
			email,
			emailVerified: Boolean(selected),
			name: profile.name || profile.login,
			avatar_url: profile.avatar_url,
			login: profile.login,
			company: profile.company,
			blog: profile.blog,
			location: profile.location,
			bio: profile.bio,
			twitter_username: profile.twitter_username,
		},
		context,
	);
}

async function resolveDiscordIdentity(
	tokens: OAuthTokenSet,
	_claims: unknown,
	context: Readonly<Record<string, string>>,
): Promise<ExternalIdentity> {
	const profile = await fetchOAuthUserData<DiscordUser>(
		"Discord",
		"https://discord.com/api/users/@me",
		tokens.accessToken,
	);
	if (!profile.verified) {
		throw new Error("A verified Discord email address is required.");
	}
	const avatarUrl = profile.avatar_url
		? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar_url}.png`
		: "https://cdn.discordapp.com/embed/avatars/0.png";
	return identity(
		"discord",
		profile.id,
		{
			id: profile.id,
			email: profile.email,
			emailVerified: true,
			name: profile.global_name || profile.username,
			avatar_url: avatarUrl,
			username: profile.username,
			discriminator: profile.discriminator,
		},
		context,
	);
}

async function resolveGitLabIdentity(
	tokens: OAuthTokenSet,
	_claims: unknown,
	context: Readonly<Record<string, string>>,
): Promise<ExternalIdentity> {
	const profile = await fetchOAuthUserData<GitLabUser>(
		"GitLab",
		"https://gitlab.com/api/v4/user",
		tokens.accessToken,
		{ "User-Agent": "FOSDEM PWA" },
	);
	return identity(
		"gitlab",
		String(profile.id),
		{
			id: String(profile.id),
			email:
				profile.email ||
				`${profile.id}+${profile.username}@users.noreply.gitlab.com`,
			emailVerified: Boolean(profile.email),
			name: profile.name || profile.username,
			avatar_url: profile.avatar_url,
			username: profile.username,
			bio: profile.bio,
			location: profile.location,
			blog: profile.website_url,
		},
		context,
	);
}

async function resolveMastodonIdentity(
	baseUrl: string,
	tokens: OAuthTokenSet,
	context: Readonly<Record<string, string>>,
): Promise<ExternalIdentity> {
	const profile = await fetchOAuthUserData<MastodonUser>(
		"Mastodon",
		`${baseUrl}/api/v1/accounts/verify_credentials`,
		tokens.accessToken,
	);
	const host = new URL(baseUrl).hostname;
	return identity(
		"mastodon",
		`${host}:${profile.id}`,
		{
			id: `${host}:${profile.id}`,
			email: `${host}-${profile.id}@noreply.fosdempwa.com`,
			emailVerified: false,
			name: profile.display_name || profile.username,
			avatar_url: profile.avatar,
			username: profile.username,
			acct: profile.acct,
			url: profile.url,
		},
		context,
	);
}

function identity(
	provider: FosdemOAuthProvider,
	providerSubject: string,
	profile: OAuthUser & { readonly emailVerified: boolean },
	context: Readonly<Record<string, string>>,
): ExternalIdentity {
	const upgradeUserId = parseUpgradeUserId(context.upgradeUserId);
	const resolvedProfile = {
		...profile,
		...(upgradeUserId === undefined ? {} : { upgradeUserId }),
	};
	return {
		provider,
		providerSubject,
		email: profile.email,
		emailVerified: profile.emailVerified,
		claims: { profile: resolvedProfile },
	};
}

function parseUpgradeUserId(value: string | undefined): number | undefined {
	if (value === undefined) return undefined;
	const userId = Number(value);
	return Number.isSafeInteger(userId) && userId > 0 ? userId : undefined;
}

function providerScopes(provider: FosdemOAuthProvider): readonly string[] {
	switch (provider) {
		case "github":
			return ["user:email"];
		case "discord":
			return ["identify", "email"];
		case "gitlab":
			return ["read_user", "profile"];
		case "mastodon":
			return ["read"];
	}
}

function redirectUri(provider: FosdemOAuthProvider): string {
	const configured = {
		github: env.GITHUB_REDIRECT_URI,
		discord: env.DISCORD_REDIRECT_URI,
		gitlab: env.GITLAB_REDIRECT_URI,
		mastodon: env.MASTODON_REDIRECT_URI,
	}[provider];
	return configured || `${env.CF_PAGES_URL}/api/auth/callback/${provider}`;
}

function requireMastodonInstance(value: string | undefined) {
	const instance = MASTODON_INSTANCES.find(
		(candidate) => candidate.name === value || candidate.baseUrl === value,
	);
	if (!instance?.clientId || !instance.clientSecret) {
		throw new Error("The selected Mastodon server is not configured.");
	}
	return instance;
}

function oauthCookieOptions() {
	return {
		path: "/",
		secure: env.NODE_ENV === "production",
		httpOnly: true,
		maxAge: 10 * 60,
		sameSite: "lax" as const,
	};
}

function toOAuthState(
	record: typeof oauthState.$inferSelect,
): OAuthStateRecord {
	return {
		stateHash: record.state_hash,
		provider: record.provider,
		...(record.code_verifier ? { codeVerifier: record.code_verifier } : {}),
		...(record.nonce ? { nonce: record.nonce } : {}),
		...(record.redirect_uri ? { redirectUri: record.redirect_uri } : {}),
		...(record.context ? { context: record.context } : {}),
		createdAt: new Date(record.created_at),
		expiresAt: new Date(record.expires_at),
	};
}

interface GitHubEmail {
	readonly email: string;
	readonly primary: boolean;
	readonly verified: boolean;
}
