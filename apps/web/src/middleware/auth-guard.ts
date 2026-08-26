import { createMiddleware } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";

import { getAuthSession } from "~/server/auth";

/**
 * Middleware to force authentication on a server function, and add the user to the context.
 */
export const authMiddleware = createMiddleware().server(async ({ next }) => {
	const { user } = await getAuthSession();

	if (!user) {
		// Calling next() here would run the wrapped handler unauthenticated with
		// `context: undefined`; throwing stops the chain instead.
		setResponseStatus(401);
		throw new Response(null, { status: 401 });
	}

	return next({ context: { user } });
});
