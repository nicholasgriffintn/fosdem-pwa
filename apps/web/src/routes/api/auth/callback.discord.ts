import { createFileRoute } from "@tanstack/react-router";

import { completeOAuth } from "~/server/oauth";

export const Route = createFileRoute("/api/auth/callback/discord")({
	server: {
		handlers: {
			GET: ({ request }: { request: Request }) =>
				completeOAuth("discord", request),
		},
	},
});
