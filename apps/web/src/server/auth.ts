import { env } from "cloudflare:workers";
import {
	type AuthUser,
	createAuth,
	type ExternalIdentity,
	type IdentityStore,
	type UserStore,
} from "@ngriffin_uk/auth-core";
import {
	deleteCookie,
	getCookie,
	setCookie,
} from "@tanstack/react-start/server";
import { and, eq } from "drizzle-orm";

import { createStandardDate } from "~/lib/dateTime";
import { db } from "~/server/db";
import {
	oauthAccount,
	type Session,
	type User,
	user as userTable,
} from "~/server/db/schema";
import { generateGuestUsername } from "~/server/lib/guest-username";
import { oauthProfile } from "~/server/lib/oauth-profile";
import {
	buildNewUserData,
	buildUpgradeUserData,
} from "~/server/lib/provider-mapping";
import { createFosdemSessionStore } from "~/server/session-store";

export const SESSION_COOKIE_NAME = "session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const SESSION_TTL_MS = SESSION_TTL_SECONDS * 1_000;
const SESSION_REFRESH_WINDOW_MS = 15 * 24 * 60 * 60 * 1_000;
const SESSION_REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1_000;

export interface FosdemAuthUser extends AuthUser {
	readonly record: User;
}

const users: UserStore<FosdemAuthUser> = {
	async findById(userId) {
		const id = Number(userId);
		if (!Number.isSafeInteger(id)) return null;
		const record = await db.query.user.findFirst({
			where: eq(userTable.id, id),
		});
		return record ? toAuthUser(record) : null;
	},
};

const sessions = createFosdemSessionStore({
	sessionTtlMs: SESSION_TTL_MS,
	refreshWindowMs: SESSION_REFRESH_WINDOW_MS,
	refreshIntervalMs: SESSION_REFRESH_INTERVAL_MS,
});

const identities: IdentityStore<FosdemAuthUser> = {
	findUser: findIdentityUser,
	resolve: resolveIdentity,
};

export async function resolveIdentity(
	identity: ExternalIdentity,
): Promise<FosdemAuthUser> {
	const profile = oauthProfile(identity);
	const existing = await findIdentityUser(
		identity.provider,
		identity.providerSubject,
	);
	if (existing && !existing.record.is_guest) return existing;

	if (identity.emailVerified && identity.email) {
		const emailUser = await db.query.user.findFirst({
			where: eq(userTable.email, identity.email),
		});
		if (emailUser && emailUser.id !== existing?.record.id) {
			if (existing?.record.is_guest) {
				await reassignIdentity(emailUser.id, identity);
			} else {
				await linkIdentity(emailUser.id, identity);
			}
			return toAuthUser(emailUser);
		}
	}

	if (existing) {
		if (profile.upgradeUserId === existing.record.id) {
			const upgraded = await upgradeGuestIdentity(
				profile.upgradeUserId,
				identity,
				true,
			);
			if (upgraded) return toAuthUser(upgraded);
		}
		return existing;
	}

	if (profile.upgradeUserId !== undefined) {
		const upgraded = await upgradeGuestIdentity(
			profile.upgradeUserId,
			identity,
			false,
		);
		if (upgraded) return toAuthUser(upgraded);
	}

	try {
		const [created] = await db
			.insert(userTable)
			.values(buildNewUserData(identity.provider, profile))
			.returning();
		if (!created) throw new Error("OAuth user creation failed.");
		await linkIdentity(created.id, identity);
		return toAuthUser(created);
	} catch (cause) {
		const raced = await findIdentityUser(
			identity.provider,
			identity.providerSubject,
		);
		if (raced) return raced;
		throw cause;
	}
}

export const auth = createAuth({
	users,
	sessions,
	identities,
	sessionTtlMs: SESSION_TTL_MS,
});

export async function getAuthSession(
	{ refreshCookie } = { refreshCookie: true },
) {
	const token = getCookie(SESSION_COOKIE_NAME);
	if (!token) return { session: null, user: null };

	const authenticated = refreshCookie
		? await auth.touchSession(token)
		: await auth.authenticate(token);
	if (!authenticated) {
		deleteCookie(SESSION_COOKIE_NAME);
		return { session: null, user: null };
	}
	if (refreshCookie) {
		setSessionTokenCookie(token, authenticated.expiresAt);
	}
	const user = authenticated.user.record;
	const session: Session = {
		id: token,
		user_id: user.id,
		expires_at: authenticated.expiresAt.toISOString(),
		last_extended_at: new Date().toISOString(),
	};
	return {
		session,
		user,
		isGuest: user.is_guest === true,
	};
}

export const getFullAuthSession = getAuthSession;
export type { SessionUser } from "~/types/auth";

export async function invalidateSession(token: string): Promise<void> {
	await auth.revokeSession(token);
}

export async function signOut(): Promise<void> {
	const { session } = await getAuthSession({ refreshCookie: false });
	deleteCookie(SESSION_COOKIE_NAME);
	if (session) {
		await invalidateSession(session.id);
	}
}

export function setSessionTokenCookie(token: string, expiresAt: Date) {
	setCookie(SESSION_COOKIE_NAME, token, {
		httpOnly: true,
		sameSite: "lax",
		secure: env.NODE_ENV === "production",
		expires: expiresAt,
		maxAge: SESSION_TTL_SECONDS,
		path: "/",
	});
}

export async function createGuestSession(): Promise<{
	token: string;
	session: Session;
	user: User;
}> {
	const user = await createGuestUser();
	const issued = await auth.createSession(String(user.id));
	return {
		token: issued.token,
		session: {
			id: issued.token,
			user_id: user.id,
			expires_at: issued.expiresAt.toISOString(),
			last_extended_at: new Date().toISOString(),
		},
		user,
	};
}

async function createGuestUser(): Promise<User> {
	const now = createStandardDate(new Date()).toISOString();
	const username = generateGuestUsername();
	const [created] = await db
		.insert(userTable)
		.values({
			name: username,
			is_guest: true,
			created_at: now,
			updated_at: now,
		})
		.returning();
	if (!created) throw new Error("Guest user creation failed.");
	return created;
}

async function upgradeGuestIdentity(
	userId: number,
	identity: ExternalIdentity,
	identityAlreadyLinked: boolean,
): Promise<User | null> {
	const profile = oauthProfile(identity);
	const guest = await db.query.user.findFirst({
		where: and(eq(userTable.id, userId), eq(userTable.is_guest, true)),
	});
	if (!guest) return null;
	const [updated] = await db
		.update(userTable)
		.set({
			...buildUpgradeUserData(identity.provider, profile),
			updated_at: createStandardDate(new Date()).toISOString(),
		})
		.where(and(eq(userTable.id, userId), eq(userTable.is_guest, true)))
		.returning();
	if (updated && !identityAlreadyLinked) {
		await linkIdentity(userId, identity);
	}
	return updated ?? null;
}

async function linkIdentity(
	userId: number,
	identity: ExternalIdentity,
): Promise<void> {
	await db.insert(oauthAccount).values({
		provider_id: identity.provider,
		provider_user_id: identity.providerSubject,
		user_id: userId,
	});
}

async function reassignIdentity(
	userId: number,
	identity: ExternalIdentity,
): Promise<void> {
	await db
		.update(oauthAccount)
		.set({ user_id: userId })
		.where(
			and(
				eq(oauthAccount.provider_id, identity.provider),
				eq(oauthAccount.provider_user_id, identity.providerSubject),
			),
		);
}

function toAuthUser(record: User): FosdemAuthUser {
	return {
		id: String(record.id),
		...(record.email ? { email: record.email } : {}),
		createdAt: new Date(record.created_at),
		record,
	};
}

async function findIdentityUser(
	provider: string,
	providerSubject: string,
): Promise<FosdemAuthUser | null> {
	const account = await db.query.oauthAccount.findFirst({
		where: and(
			eq(oauthAccount.provider_id, provider),
			eq(oauthAccount.provider_user_id, providerSubject),
		),
	});
	return account ? users.findById(String(account.user_id)) : null;
}
