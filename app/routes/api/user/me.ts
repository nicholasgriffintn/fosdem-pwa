import { createAPIFileRoute } from "@tanstack/start/api";

import { getFullAuthSession } from "~/server/auth";

export const APIRoute = createAPIFileRoute("/api/user/me")({
	GET: async () => {
		const { user } = await getFullAuthSession();

		if (!user) {
			return Response.json({ error: "Unauthorized" }, { status: 401 });
		}

		return Response.json({ user });
	},
});
