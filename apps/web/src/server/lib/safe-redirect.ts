/**
 * Resolves a caller-supplied `returnTo` value into a safe same-origin path.
 *
 * `returnTo` arrives as form data on the no-JS POST paths, so it is fully
 * attacker-controlled. A leading `/` alone is not enough: `//evil.com` is a
 * protocol-relative URL and browsers follow it off-origin, and `/\evil.com`
 * is normalised the same way by some browsers.
 */
export function safeReturnTo(
	returnTo: unknown,
	fallback = "/",
): string {
	if (typeof returnTo !== "string" || returnTo.length === 0) {
		return fallback;
	}

	if (!returnTo.startsWith("/")) {
		return fallback;
	}

	// Protocol-relative ("//host") and backslash variants escape the origin.
	if (returnTo.startsWith("//") || returnTo.startsWith("/\\")) {
		return fallback;
	}

	return returnTo;
}
