import { sha256 } from "@oslojs/crypto/sha2";
import {
	encodeBase32LowerCaseNoPadding,
	encodeHexLowerCase,
} from "@oslojs/encoding";
import { GitHub, Discord, GitLab } from "arctic";
import { and, eq } from "drizzle-orm";
import {
	deleteCookie,
	getCookie,
	setCookie,
} from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";

import { Mastodon } from "~/server/lib/mastodon-arctic";
import { createStandardDate } from "~/lib/dateTime";
import { CacheManager } from "~/server/cache";
import { CacheKeys } from "~/server/lib/cache-keys";
import { db } from "~/server/db";
import {
	session as sessionTable,
	user as userTable,
	type Session,
	type User,
} from "~/server/db/schema";
import type { GitHubUser } from "~/types/user";
import { randomInt, randomBase32 } from "~/server/lib/random";

export const SESSION_COOKIE_NAME = "session";
const TTL = 60 * 60 * 24 * 30;
const cache = CacheManager.getInstance();

export function generateSessionToken(): string {
	const bytes = new Uint8Array(20);
	crypto.getRandomValues(bytes);
	const token = encodeBase32LowerCaseNoPadding(bytes);
	return encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
}

export async function createSession(
	token: string,
	userId: number,
): Promise<Session> {
	const now = createStandardDate(new Date());
	const sessionId = token;
	const session: Session = {
		id: sessionId,
		user_id: userId,
		expires_at: new Date(now.getTime() + 1000 * TTL).toISOString(),
		last_extended_at: now.toISOString(),
	};
	await db.insert(sessionTable).values(session);
	return session;
}

export async function validateSessionToken(token: string) {
	const sessionId = token;
	const now = Date.now();

	const cachedSession = await cache.get(CacheKeys.session(sessionId));
	if (cachedSession) {
		return cachedSession;
	}

	const results = await db
		.select({
			session: {
				id: sessionTable.id,
				user_id: sessionTable.user_id,
				expires_at: sessionTable.expires_at,
				last_extended_at: sessionTable.last_extended_at,
			},
			user: userTable,
		})
		.from(sessionTable)
		.innerJoin(userTable, eq(sessionTable.user_id, userTable.id))
		.where(eq(sessionTable.id, sessionId));

	if (results.length < 1) {
		return { session: null, user: null };
	}

	const { session, user } = results[0];
	const expiresAt = new Date(session.expires_at).getTime();

	if (now >= expiresAt) {
		await Promise.all([
			cache.invalidate(CacheKeys.session(sessionId)),
			db.delete(sessionTable).where(eq(sessionTable.id, sessionId)),
		]);
		return { session: null, user: null };
	}

	const lastExtendedAt = new Date(session.last_extended_at).getTime();
	const timeSinceLastExtension = now - lastExtendedAt;
	const shouldExtend = now >= expiresAt - 1000 * 60 * 60 * 24 * 15 && timeSinceLastExtension > 24 * 60 * 60 * 1000;

	if (shouldExtend) {
		const newExpiresAt = new Date(now + 1000 * TTL).toISOString();
		const newLastExtendedAt = new Date(now).toISOString();

		session.expires_at = newExpiresAt;
		session.last_extended_at = newLastExtendedAt;

		const result = { session, user };

		await Promise.all([
			cache.set(CacheKeys.session(sessionId), result, TTL),
			db
				.update(sessionTable)
				.set({
					expires_at: newExpiresAt,
					last_extended_at: newLastExtendedAt,
				})
				.where(eq(sessionTable.id, sessionId)),
		]);

		return result;
	}

	const result = { session, user };
	await cache.set(CacheKeys.session(sessionId), result, TTL);
	return result;
}

export type { SessionUser } from "~/types/auth";

export async function invalidateSession(sessionId: string): Promise<void> {
	await Promise.all([
		cache.invalidate(CacheKeys.session(sessionId)),
		db.delete(sessionTable).where(eq(sessionTable.id, sessionId)),
	]);
}

export function setSessionTokenCookie(token: string, expiresAt: Date) {
	setCookie(SESSION_COOKIE_NAME, token, {
		httpOnly: true,
		sameSite: "lax",
		secure: env.NODE_ENV === "production",
		expires: expiresAt,
		maxAge: TTL,
		path: "/",
	});
}

const GITHUB_REDIRECT_URL = env.GITHUB_REDIRECT_URI
	? env.GITHUB_REDIRECT_URI
	: `${env.CF_PAGES_URL}/api/auth/callback/github`;
export const github = new GitHub(
	env.GITHUB_CLIENT_ID,
	env.GITHUB_CLIENT_SECRET,
	GITHUB_REDIRECT_URL,
);

const DISCORD_REDIRECT_URL = env.DISCORD_REDIRECT_URI
	? env.DISCORD_REDIRECT_URI
	: `${env.CF_PAGES_URL}/api/auth/callback/discord`;
export const discord = new Discord(
	env.DISCORD_CLIENT_ID,
	env.DISCORD_CLIENT_SECRET,
	DISCORD_REDIRECT_URL,
);

const GITLAB_REDIRECT_URL = env.GITLAB_REDIRECT_URI
	? env.GITLAB_REDIRECT_URI
	: `${env.CF_PAGES_URL}/api/auth/callback/gitlab`;
export const gitlab = new GitLab(
	"https://gitlab.com",
	env.GITLAB_CLIENT_ID,
	env.GITLAB_CLIENT_SECRET,
	GITLAB_REDIRECT_URL,
);

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
];

export function createMastodonInstance(baseUrl: string) {
	const redirectUrl = env.MASTODON_REDIRECT_URI
		? env.MASTODON_REDIRECT_URI
		: `${env.CF_PAGES_URL}/api/auth/callback/mastodon`;

	const instance = MASTODON_INSTANCES.find(inst => inst.baseUrl === baseUrl);
	if (!instance) {
		throw new Error(`Unsupported Mastodon instance: ${baseUrl}`);
	}

	if (!instance.clientId || !instance.clientSecret) {
		throw new Error(`Missing credentials for Mastodon instance: ${instance.name}`);
	}

	return new Mastodon(
		baseUrl,
		instance.clientId,
		instance.clientSecret,
		redirectUrl,
	);
}

/**
 * Retrieves the session and user data if valid.
 * Can be used in API routes and server functions.
 */
export async function getAuthSession(
	{ refreshCookie } = { refreshCookie: true },
) {
	const token = getCookie(SESSION_COOKIE_NAME);
	if (!token) {
		return { session: null, user: null };
	}

	const { session, user } = await validateSessionToken(token);

	if (session === null) {
		deleteCookie(SESSION_COOKIE_NAME);
		return { session: null, user: null };
	}

	if (refreshCookie) {
		const now = Date.now();
		const lastExtendedAt = new Date(session.last_extended_at).getTime();
		const timeSinceLastExtension = now - lastExtendedAt;

		if (timeSinceLastExtension > 24 * 60 * 60 * 1000) {
			setSessionTokenCookie(token, new Date(session.expires_at));
		}
	}

	return {
		session,
		user,
		isGuest: user.is_guest === true,
	};
}

export const getFullAuthSession = getAuthSession;

/**
 * Generates a random guest username
 */
const adjectives = [
	"happy", "quick", "clever", "bright", "swift", "bold", "calm", "eager", "fair", "gentle",
	"kind", "lively", "nice", "proud", "wise"
];
const nouns = [
	"penguin", "dolphin", "eagle", "lion", "fox", "tiger", "bear", "wolf", "owl", "falcon",
	"deer", "panda", "hawk", "raven", "otter"
];
export function generateGuestUsername(): string {
	const adjective = adjectives[randomInt(adjectives.length)];
	const noun = nouns[randomInt(nouns.length)];
	const random = randomBase32(6);

	return `${adjective}-${noun}-${random}`;
}

/**
 * Creates a guest user
 */
export async function createGuestUser(): Promise<User> {
	const now = createStandardDate(new Date()).toISOString();
	const username = generateGuestUsername();

	const guestUser = {
		name: username,
		email: `guest-${username}@fosdempwa.com`,
		github_id: null,
		is_guest: true,
		created_at: now,
		updated_at: now,
	};

	const [user] = await db.insert(userTable).values(guestUser).returning();
	return user;
}

/**
 * Upgrades a guest user to a GitHub user
 */
export async function upgradeGuestToGithub(
	userId: number,
	providerUser: GitHubUser,
): Promise<User> {
	const now = createStandardDate(new Date()).toISOString();

	const [updatedUser] = await db
		.update(userTable)
		.set({
			github_username: providerUser.login,
			email:
				providerUser.email ||
				`${providerUser.id}+${providerUser.login}@users.noreply.github.com`,
			name: providerUser.name || providerUser.login,
			avatar_url: providerUser.avatar_url,
			company: providerUser.company,
			site: providerUser.blog,
			location: providerUser.location,
			bio: providerUser.bio,
			twitter_username: providerUser.twitter_username,
			is_guest: false,
			updated_at: now,
		})
		.where(and(eq(userTable.id, userId), eq(userTable.is_guest, true)))
		.returning();

	if (updatedUser) {
		const sessions = await db
			.select({ id: sessionTable.id })
			.from(sessionTable)
			.where(eq(sessionTable.user_id, userId));

		await Promise.all(
			sessions.map((session) => cache.invalidate(CacheKeys.session(session.id))),
		);
	}

	return updatedUser;
}

/**
 * Creates an initial guest session
 */
export async function createGuestSession(): Promise<{
	token: string;
	session: Session;
	user: User;
}> {
	const user = await createGuestUser();
	const token = generateSessionToken();
	const session = await createSession(token, user.id);

	return { token, session, user };
}
