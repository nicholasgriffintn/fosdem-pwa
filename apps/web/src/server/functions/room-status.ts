import { createServerFn } from "@tanstack/react-start";

import { constants } from "~/constants";
import {
  findLatestRoomStatus,
  findLatestRoomStatuses,
  findRoomStatusHistory,
} from "~/server/repositories/room-status-repository";

export interface RoomStatusResult {
  room: string;
  state: "full" | "available" | "unknown";
  lastUpdate: string;
}

export interface RoomStatusBatchResult {
  room: string;
  state: "full" | "available" | "unknown";
  lastUpdate: string;
}

function convertState(state: string): RoomStatusResult["state"] {
  if (state === "1") {
    return "full";
  }
  if (state === "0") {
    return "available";
  }
  return "unknown";
}

export const getRoomStatus = createServerFn({
  method: "GET",
})
  .inputValidator((data: { roomName: string }) => data)
  .handler(async (ctx): Promise<RoomStatusResult> => {
    const { roomName } = ctx.data;

    try {
      const status = await findLatestRoomStatus(roomName, constants.DEFAULT_YEAR);

      if (!status) {
        return {
          room: roomName,
          state: "unknown",
          lastUpdate: "",
        };
      }

      return {
        room: roomName,
        state: convertState(status.state),
        lastUpdate: status.recorded_at,
      };
    } catch (error) {
      console.error("Failed to get room status from database:", error);
      return {
        room: roomName,
        state: "unknown",
        lastUpdate: "",
      };
    }
  });

export const getRoomStatusHistory = createServerFn({
  method: "GET",
})
  .inputValidator((data: { roomName: string; limit?: number }) => data)
  .handler(async (ctx) => {
    const { roomName, limit = 10 } = ctx.data;

    try {
      const history = await findRoomStatusHistory(
        roomName,
        constants.DEFAULT_YEAR,
        limit,
      );

      return history.map((h) => ({
        state: convertState(h.state),
        recordedAt: h.recorded_at,
      }));
    } catch (error) {
      console.error("Failed to get room status history:", error);
      return [];
    }
  });

export const getRoomStatuses = createServerFn({
  method: "GET",
})
  .inputValidator((data: unknown): { roomNames: string[] } => {
    if (typeof data !== "object" || data === null || !("roomNames" in data)) {
      throw new Error("Invalid input; expected { roomNames: string[] }");
    }

    const rawRoomNames: unknown[] = Array.isArray(
      (data as { roomNames?: unknown }).roomNames,
    )
      ? (data as { roomNames: unknown[] }).roomNames
      : [];
    const roomNames = rawRoomNames
      .filter((roomName): roomName is string => typeof roomName === "string")
      .map((roomName) => roomName.trim())
      .filter((roomName) => roomName.length > 0);

    return { roomNames: Array.from(new Set(roomNames)) };
  })
  .handler(async (ctx): Promise<RoomStatusBatchResult[]> => {
    const { roomNames } = ctx.data;

    if (!roomNames.length) {
      return [];
    }

    try {
      const latestStatuses = await findLatestRoomStatuses(
        roomNames,
        constants.DEFAULT_YEAR,
      );
      const latestByRoom = new Map(
        latestStatuses.map((status) => [status.room_name, status]),
      );

      return roomNames.map((roomName) => {
        const status = latestByRoom.get(roomName);
        if (!status) {
          return {
            room: roomName,
            state: "unknown",
            lastUpdate: "",
          };
        }

        return {
          room: roomName,
          state: convertState(status.state),
          lastUpdate: status.updated_at,
        };
      });
    } catch (error) {
      console.error("Failed to get room statuses from database:", error);
      return roomNames.map((roomName) => ({
        room: roomName,
        state: "unknown",
        lastUpdate: "",
      }));
    }
  });
