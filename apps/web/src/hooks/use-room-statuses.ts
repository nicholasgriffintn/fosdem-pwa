"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import type { RoomStatusBatchResult } from "~/server/functions/room-status";
import { getRoomStatuses } from "~/server/functions/room-status";
import { roomStatusQueryKeys } from "~/lib/query-keys";

export function useRoomStatuses(roomNames: string[]) {
	const fetchRoomStatuses = useServerFn(getRoomStatuses);
	const normalizedRoomNames = useMemo(
		() =>
			Array.from(
				new Set(
					roomNames
						.filter(Boolean)
						.map((roomName) => roomName.trim())
						.filter((roomName) => roomName.length > 0),
				),
			).sort(),
		[roomNames],
	);

	const query = useQuery({
		queryKey: roomStatusQueryKeys.statuses(normalizedRoomNames),
		queryFn: () => fetchRoomStatuses({ data: { roomNames: normalizedRoomNames } }),
		enabled: normalizedRoomNames.length > 0,
		refetchInterval: 60000,
		staleTime: 1000 * 60 * 5,
	});

	const statusByRoom = useMemo(() => {
		const map = new Map<string, RoomStatusBatchResult>();
		(query.data ?? []).forEach((status) => {
			map.set(status.room, status);
		});
		return map;
	}, [query.data]);

	return {
		...query,
		statusByRoom,
		roomNames: normalizedRoomNames,
	};
}
