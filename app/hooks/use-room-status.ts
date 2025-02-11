"use client";

import { useQuery } from "@tanstack/react-query";

interface RoomStatus {
	room: string;
	state: "full" | "available" | "unknown";
	lastUpdate: string;
}

function convertState(state: string): RoomStatus["state"] {
	if (state === "1") {
		return "full";
	}
	return "available";
}

async function fetchRoomStatus(roomId: string): Promise<RoomStatus> {
	try {
		const response = await fetch("/api/proxy/rooms/status");

		if (!response.ok) {
			throw new Error("Failed to fetch room status");
		}

		const data = await response.json();

		const status = data.find((room: any) => room.roomname === roomId);
		return { room: roomId, state: status?.state ? convertState(status.state) : "unknown", lastUpdate: new Date().toISOString() };
	} catch (error) {
		console.error("Failed to fetch room status:", error);
		return { room: roomId, state: "unknown", lastUpdate: "" };
	}
}

export function useRoomStatus(roomId: string) {
	return useQuery({
		queryKey: ["roomStatus", roomId],
		queryFn: () => fetchRoomStatus(roomId),
		refetchInterval: 60000, // Refetch every minute
		staleTime: 30000, // Consider data stale after 30 seconds
	});
}
