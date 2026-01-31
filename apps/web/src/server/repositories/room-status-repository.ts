import { eq, and, desc, inArray } from "drizzle-orm";

import { db } from "~/server/db";
import {
	roomStatusHistory as roomStatusHistoryTable,
	roomStatusLatest as roomStatusLatestTable,
	type RoomStatusHistory,
	type RoomStatusLatest,
} from "~/server/db/schema";

export async function findLatestRoomStatus(
  roomName: string,
  year: number,
): Promise<RoomStatusHistory | undefined> {
  return db.query.roomStatusHistory.findFirst({
    where: and(
      eq(roomStatusHistoryTable.room_name, roomName),
      eq(roomStatusHistoryTable.year, year),
    ),
    orderBy: [desc(roomStatusHistoryTable.recorded_at)],
  });
}

export async function findRoomStatusHistory(
	roomName: string,
	year: number,
	limit = 10,
): Promise<RoomStatusHistory[]> {
  return db
    .select()
    .from(roomStatusHistoryTable)
    .where(
      and(
        eq(roomStatusHistoryTable.room_name, roomName),
        eq(roomStatusHistoryTable.year, year),
      ),
    )
    .orderBy(desc(roomStatusHistoryTable.recorded_at))
	.limit(limit);
}

export async function findLatestRoomStatuses(
	roomNames: string[],
	year: number,
): Promise<RoomStatusLatest[]> {
	if (!roomNames.length) {
		return [];
	}

	return db
		.select()
		.from(roomStatusLatestTable)
		.where(
			and(
				eq(roomStatusLatestTable.year, year),
				inArray(roomStatusLatestTable.room_name, roomNames),
			),
		);
}
