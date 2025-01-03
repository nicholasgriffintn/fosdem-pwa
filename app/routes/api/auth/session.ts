import { createAPIFileRoute } from "@tanstack/start/api";

import { getAuthSession } from "~/server/auth";

export const APIRoute = createAPIFileRoute("/api/auth/session")({
	GET: async () => {
		const { user } = await getAuthSession();
		return Response.json({ user });
	},
});
