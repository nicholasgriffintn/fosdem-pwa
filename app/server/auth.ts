import { sha256 } from "@oslojs/crypto/sha2";
import {
	encodeBase32LowerCaseNoPadding,
	encodeHexLowerCase,
} from "@oslojs/encoding";
import { GitHub } from "arctic";
import { eq } from "drizzle-orm";
import { deleteCookie, getCookie, setCookie } from "vinxi/http";

import { db } from "~/server/db";
import {
	session as sessionTable,
	user as userTable,
	type Session,
} from "~/server/db/schema";

export const SESSION_COOKIE_NAME = "session";

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
	const sessionId = token;
	const session: Session = {
		id: sessionId,
		user_id: userId,
		expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
	};
	await db.insert(sessionTable).values(session);
	return session;
}

export async function validateSessionToken(token: string) {
	const sessionId = token;
	const now = Date.now();

	const results = await db
		.select({
			session: {
				user_id: sessionTable.user_id,
				expires_at: sessionTable.expires_at,
			},
			user: userTable
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
		await db.delete(sessionTable).where(eq(sessionTable.id, sessionId));
		return { session: null, user: null };
	}

	const shouldExtend = now >= expiresAt - 1000 * 60 * 60 * 24 * 15;
	if (shouldExtend) {
		const lastExtensionTime = new Date(session.expires_at).getTime() - (30 * 24 * 60 * 60 * 1000);
		const timeSinceLastExtension = now - lastExtensionTime;

		if (timeSinceLastExtension > 24 * 60 * 60 * 1000) {
			session.expires_at = new Date(now + 1000 * 60 * 60 * 24 * 30).toISOString();
			db.update(sessionTable)
				.set({
					expires_at: session.expires_at,
				})
				.where(eq(sessionTable.id, sessionId))
				.catch(console.error);
		}
	}

	return { session, user };
}

export type SessionUser = NonNullable<
	Awaited<ReturnType<typeof validateSessionToken>>["user"]
>;

export async function invalidateSession(sessionId: string): Promise<void> {
	await db.delete(sessionTable).where(eq(sessionTable.id, sessionId));
}

export function setSessionTokenCookie(token: string, expiresAt: Date) {
	setCookie(SESSION_COOKIE_NAME, token, {
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		expires: expiresAt,
		path: "/",
	});
}

// OAuth2 Providers
export const github = new GitHub(
	process.env.GITHUB_CLIENT_ID as string,
	process.env.GITHUB_CLIENT_SECRET as string,
	process.env.GITHUB_REDIRECT_URI || null,
);

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
		const expiresAt = new Date(session.expires_at).getTime();
		const lastExtensionTime = expiresAt - (30 * 24 * 60 * 60 * 1000);
		const timeSinceLastExtension = now - lastExtensionTime;

		if (timeSinceLastExtension > 24 * 60 * 60 * 1000) {
			setSessionTokenCookie(token, new Date(session.expires_at));
		}
	}

	return { session, user };
}

export const getFullAuthSession = getAuthSession;
