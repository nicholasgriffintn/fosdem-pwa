"use client";

import { useQuery } from "@tanstack/react-query";

import { constants } from "~/constants";

interface RoomStatus {
  room: string;
  state: "full" | "available" | "unknown";
  lastUpdate: string;
}

async function fetchRoomStatus(roomId: string): Promise<RoomStatus> {
  try {
    const response = await fetch(constants.ROOMS_API);

    if (!response.ok) {
      throw new Error("Failed to fetch room status");
    }

    const data = await response.json();

    const status = data.find((room: RoomStatus) => room.room === roomId);
    return status || { room: roomId, state: "unknown", lastUpdate: "" };
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