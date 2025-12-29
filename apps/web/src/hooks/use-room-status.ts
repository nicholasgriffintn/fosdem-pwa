"use client";

import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getRoomStatus } from "~/server/functions/room-status";
import { roomStatusQueryKeys } from "~/lib/query-keys";

export function useRoomStatus(roomId: string) {
	const fetchRoomStatus = useServerFn(getRoomStatus);

	return useQuery({
		queryKey: roomStatusQueryKeys.status(roomId),
		queryFn: () => fetchRoomStatus({ data: { roomName: roomId } }),
		refetchInterval: 60000,
		staleTime: 1000 * 60 * 5, // 5 minutes
	});
}
