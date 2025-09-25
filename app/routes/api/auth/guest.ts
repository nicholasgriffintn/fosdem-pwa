import { createAPIFileRoute } from "@tanstack/start/api";
import { createGuestSession, setSessionTokenCookie } from "~/server/auth";

export const APIRoute = createAPIFileRoute("/api/auth/guest")({
	POST: async () => {
		try {
			const { token, session } = await createGuestSession();
			setSessionTokenCookie(token, new Date(session.expires_at));

			return new Response(null, {
				status: 302,
				headers: {
					Location: "/",
				},
			});
		} catch (error) {
			console.error("Guest Sign In Error:", error);
			return new Response("Internal Server Error", {
				status: 500,
			});
		}
	},
});
