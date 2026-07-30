import { createFileRoute } from "@tanstack/react-router";

import { completeOAuth } from "~/server/oauth";

export const Route = createFileRoute("/api/auth/callback/github")({
	server: {
		handlers: {
			GET: ({ request }: { request: Request }) =>
				completeOAuth("github", request),
		},
	},
});
