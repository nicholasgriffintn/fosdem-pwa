import { createFileRoute } from "@tanstack/react-router";
import { getRoomStatusResponse } from "~/server/lib/room-status-proxy";

export const Route = createFileRoute("/api/proxy/rooms/status")({
	server: { handlers: { GET: () => getRoomStatusResponse() } },
});
