"use client";

import { conferenceConfig } from "@roomisfull/conference";

import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getRoomStatusHistory } from "~/server/functions/room-status";
import { roomStatusQueryKeys } from "~/lib/query-keys";

export function useRoomStatusHistory(roomId: string, limit = 10) {
	const fetchHistory = useServerFn(getRoomStatusHistory);

	return useQuery({
		enabled: Boolean(conferenceConfig.integrations.roomStatus),
		queryKey: roomStatusQueryKeys.history(roomId, limit),
		queryFn: () => fetchHistory({ data: { roomName: roomId, limit } }),
		refetchInterval: 60000,
		staleTime: 1000 * 60 * 5, // 5 minutes
	});
}
