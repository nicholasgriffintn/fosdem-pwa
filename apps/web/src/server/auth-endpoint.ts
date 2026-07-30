import type { AuthRequest } from "@ngriffin_uk/auth-react";

import {
	createGuestSession,
	setSessionTokenCookie,
	signOut,
} from "~/server/auth";
import {
	type FosdemOAuthProvider,
	oauthRequestOptions,
	startOAuthResult,
} from "~/server/oauth";

export async function handleAuthRequest(request: Request): Promise<Response> {
	try {
		const authRequest = await readAuthRequest(request);
		if (authRequest.action === "sign_out") {
			await signOut();
			return Response.json({ status: "completed" });
		}
		if (authRequest.action !== "start_oauth") {
			return authenticationErrorResponse(400);
		}
		if (authRequest.provider === "guest") {
			const { token, session } = await createGuestSession();
			setSessionTokenCookie(token, new Date(session.expires_at));
			return Response.json({ status: "authenticated" });
		}
		if (!isOAuthProvider(authRequest.provider)) {
			return authenticationErrorResponse(400);
		}
		return Response.json(
			await startOAuthResult(
				authRequest.provider,
				oauthRequestOptions(authRequest),
			),
		);
	} catch {
		return authenticationErrorResponse(500);
	}
}

async function readAuthRequest(request: Request): Promise<AuthRequest> {
	const value: unknown = await request.json();
	if (isRecord(value) && value.action === "sign_out") {
		return { action: "sign_out" };
	}
	if (
		!isRecord(value) ||
		value.action !== "start_oauth" ||
		typeof value.provider !== "string" ||
		(value.values !== undefined && !isStringRecord(value.values))
	) {
		throw new TypeError("The authentication request is invalid.");
	}
	return {
		action: "start_oauth",
		provider: value.provider,
		...(value.values === undefined ? {} : { values: value.values }),
	};
}

function isOAuthProvider(value: string): value is FosdemOAuthProvider {
	return (
		value === "discord" ||
		value === "github" ||
		value === "gitlab" ||
		value === "mastodon"
	);
}

function authenticationErrorResponse(status: number): Response {
	return Response.json(
		{ error: "Authentication could not be completed." },
		{ status },
	);
}

function isStringRecord(value: unknown): value is Record<string, string> {
	return (
		isRecord(value) &&
		Object.values(value).every((entry) => typeof entry === "string")
	);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
