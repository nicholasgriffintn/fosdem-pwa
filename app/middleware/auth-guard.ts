import { createMiddleware } from "@tanstack/start";
import { setResponseStatus } from "vinxi/http";
import { getAuthSession } from "~/server/auth";

/**
 * Middleware to force authentication on a server function, and add the user to the context.
 */
export const authMiddleware = createMiddleware().server(async ({ next }) => {
	const { user } = await getAuthSession();

	if (!user) {
		setResponseStatus(401);
		return;
	}

	return next({ context: { user } });
});
