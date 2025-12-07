import { createAPIFileRoute } from "@tanstack/start/api";

import { constants } from "~/constants";

export const APIRoute = createAPIFileRoute("/api/proxy/rooms/status")({
	GET: async () => {
		try {
			const response = await fetch(constants.ROOMS_API);

			if (!response.ok) {
				return new Response(
					JSON.stringify({ error: "Failed to fetch room status" }),
					{
						status: 500,
						headers: {
							"Content-Type": "application/json",
						},
					},
				);
			}

			const data = await response.json();
			return new Response(JSON.stringify(data), {
				status: 200,
				headers: {
					"Content-Type": "application/json",
				},
			});
		} catch (error) {
			console.error("Failed to fetch room status:", error);
			return new Response(
				JSON.stringify({ error: "Failed to fetch room status" }),
				{
					status: 500,
					headers: {
						"Content-Type": "application/json",
					},
				},
			);
		}
	},
});
