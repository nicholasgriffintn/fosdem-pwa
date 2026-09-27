import { createFileRoute } from "@tanstack/react-router";
import { getSubtitleResponse } from "~/server/lib/subtitle-proxy";

export const Route = createFileRoute("/api/proxy/subtitles")({
	server: { handlers: { GET: ({ request }) => getSubtitleResponse(request) } },
});
