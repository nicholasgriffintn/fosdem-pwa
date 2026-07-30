const OAUTH_CALLBACK_ERROR = "oauth_callback_failed";

export function authenticationFailureRedirect(request: Request): Response {
	const location = new URL("/signin", request.url);
	location.searchParams.set("authError", OAUTH_CALLBACK_ERROR);
	return redirectResponse(location);
}

export function redirectResponse(location: string | URL): Response {
	return new Response(null, {
		status: 302,
		headers: { Location: location.toString() },
	});
}
