import { createFileRoute } from "@tanstack/react-router";
import { deleteCookie } from "@tanstack/react-start/server";

import {
	getAuthSession,
	invalidateSession,
	SESSION_COOKIE_NAME,
} from "~/server/auth";

export const Route = createFileRoute("/api/auth/logout")({
	server: {
		handlers: {
			GET: async () => {
				const { session } = await getAuthSession({ refreshCookie: false });
				if (!session) {
					return new Response(null, {
						status: 401,
					});
				}

				deleteCookie(SESSION_COOKIE_NAME);
				await invalidateSession(session.id);

				return new Response(null, {
					status: 302,
					headers: {
						Location: "/",
					},
				});
			},
		},
	},
});
