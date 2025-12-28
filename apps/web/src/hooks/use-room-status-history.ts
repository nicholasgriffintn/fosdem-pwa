"use client";

import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getRoomStatusHistory } from "~/server/functions/room-status";

export function useRoomStatusHistory(roomId: string, limit = 10) {
  const fetchHistory = useServerFn(getRoomStatusHistory);

  return useQuery({
    queryKey: ["roomStatusHistory", roomId, limit],
    queryFn: () => fetchHistory({ data: { roomName: roomId, limit } }),
    refetchInterval: 60000,
    staleTime: 30000,
  });
}
