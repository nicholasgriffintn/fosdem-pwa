import { createFileRoute } from "@tanstack/react-router";

import { handleAuthRequest } from "~/server/auth-endpoint";

export const Route = createFileRoute("/api/auth/")({
	server: {
		handlers: {
			POST: ({ request }: { request: Request }) => handleAuthRequest(request),
		},
	},
});
