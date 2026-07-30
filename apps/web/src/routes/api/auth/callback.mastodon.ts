import { createFileRoute } from "@tanstack/react-router";

import { completeOAuth } from "~/server/oauth";

export const Route = createFileRoute("/api/auth/callback/mastodon")({
	server: {
		handlers: {
			GET: ({ request }: { request: Request }) =>
				completeOAuth("mastodon", request),
		},
	},
});
