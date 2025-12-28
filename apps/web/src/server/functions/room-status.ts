import { createServerFn } from "@tanstack/react-start";

import { constants } from "~/constants";
import {
  findLatestRoomStatus,
  findRoomStatusHistory,
} from "~/server/repositories/room-status-repository";

export interface RoomStatusResult {
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
