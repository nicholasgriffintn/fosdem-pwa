import { env } from "cloudflare:workers";

import {
	createGuestSession,
	setSessionTokenCookie,
	signOut,
} from "~/server/auth";
import { oauthRequestOptions, startOAuthResult } from "~/server/oauth";
import { readAuthRequest } from "~/server/lib/auth-request";
import { isFosdemOAuthProvider } from "~/server/lib/oauth-provider";
import {
	resolveTurnstileSecret,
	verifyTurnstileToken,
} from "~/server/lib/turnstile";

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
		if (
			!(await verifyTurnstileToken({
				token: authRequest.values?.turnstileToken,
				secret: resolveTurnstileSecret(env.NODE_ENV, env.TURNSTILE_SECRET_KEY),
				remoteIp: request.headers.get("CF-Connecting-IP") ?? undefined,
			}))
		) {
			return authenticationErrorResponse(403);
		}
		if (authRequest.provider === "guest") {
			const { token, session } = await createGuestSession();
			setSessionTokenCookie(token, new Date(session.expires_at));
			return Response.json({ status: "authenticated" });
		}
		if (!isFosdemOAuthProvider(authRequest.provider)) {
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

function authenticationErrorResponse(status: number): Response {
	return Response.json(
		{ error: "Authentication could not be completed." },
		{ status },
	);
}
