import { sha256 } from "@oslojs/crypto/sha2";
import {
	encodeBase32LowerCaseNoPadding,
	encodeHexLowerCase,
} from "@oslojs/encoding";
import { GitHub } from "arctic";
import { eq } from "drizzle-orm";
import { deleteCookie, getCookie, setCookie } from "vinxi/http";

import { createStandardDate } from "~/lib/dateTime";
import { CacheManager } from "~/lib/cache";
import { db } from "~/server/db";
import { getCloudflareEnv } from "~/server/config";
import {
	session as sessionTable,
	user as userTable,
	type Session,
} from "~/server/db/schema";

export const SESSION_COOKIE_NAME = "session";

const TTL = 60 * 60 * 24 * 30;

const cache = new CacheManager();

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

	const cachedSession = await cache.get(`session_${sessionId}`);
	if (cachedSession) {
		return cachedSession;
	}

	const results = await db
		.select({
			session: {
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
			cache.invalidate(`session_${sessionId}`),
			db.delete(sessionTable).where(eq(sessionTable.id, sessionId)),
		]);
		return { session: null, user: null };
	}

	const shouldExtend = now >= expiresAt - 1000 * 60 * 60 * 24 * 15;
	if (shouldExtend) {
		const lastExtendedAt = new Date(session.last_extended_at).getTime();
		const timeSinceLastExtension = now - lastExtendedAt;

		if (timeSinceLastExtension > 24 * 60 * 60 * 1000) {
			const newExpiresAt = new Date(now + 1000 * TTL).toISOString();
			const newLastExtendedAt = new Date(now).toISOString();

			session.expires_at = newExpiresAt;
			session.last_extended_at = newLastExtendedAt;

			await Promise.all([
				cache.set(`session_${sessionId}`, { session, user }, TTL),
				db
					.update(sessionTable)
					.set({
						expires_at: newExpiresAt,
						last_extended_at: newLastExtendedAt,
					})
					.where(eq(sessionTable.id, sessionId)),
			]);
		}
	}

	const result = { session, user };
	await cache.set(`session_${sessionId}`, result, TTL);
	return result;
}

export type SessionUser = NonNullable<
	Awaited<ReturnType<typeof validateSessionToken>>["user"]
>;

export async function invalidateSession(sessionId: string): Promise<void> {
	await Promise.all([
		cache.invalidate(`session_${sessionId}`),
		db.delete(sessionTable).where(eq(sessionTable.id, sessionId)),
	]);
}

export function setSessionTokenCookie(token: string, expiresAt: Date) {
	setCookie(SESSION_COOKIE_NAME, token, {
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV !== "development",
		expires: expiresAt,
		maxAge: TTL,
		path: "/",
	});
}

export const github = () => {
	const env = getCloudflareEnv();

	return new GitHub(
		env.GITHUB_CLIENT_ID as string,
		env.GITHUB_CLIENT_SECRET as string,
		env.GITHUB_REDIRECT_URI || null,
	);
};

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

	return { session, user };
}

export const getFullAuthSession = getAuthSession;
