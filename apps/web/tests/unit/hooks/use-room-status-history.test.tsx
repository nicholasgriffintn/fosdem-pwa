import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";

import { createQueryClientWrapper } from "../../utils/queryClient";
import { useRoomStatusHistory } from "~/hooks/use-room-status-history";

vi.mock("@tanstack/react-start", () => ({
	useServerFn: (fn: unknown) => fn,
}));

const roomStatusMocks = vi.hoisted(() => ({
	getRoomStatusHistory: vi.fn(),
}));

vi.mock("~/server/functions/room-status", () => roomStatusMocks);

const getRoomStatusHistoryMock = vi.mocked(roomStatusMocks.getRoomStatusHistory);

const mockHistory = [
	{ state: "full" as const, recordedAt: "2024-02-03T10:00:00Z" },
	{ state: "full" as const, recordedAt: "2024-02-03T09:55:00Z" },
	{ state: "available" as const, recordedAt: "2024-02-03T09:50:00Z" },
	{ state: "available" as const, recordedAt: "2024-02-03T09:45:00Z" },
];

describe("useRoomStatusHistory", () => {
	beforeEach(() => {
		getRoomStatusHistoryMock.mockReset();
	});

	it("fetches room status history", async () => {
		getRoomStatusHistoryMock.mockResolvedValue(mockHistory);

		const { wrapper, queryClient } = createQueryClientWrapper();
		const { result } = renderHook(() => useRoomStatusHistory("room-1"), {
			wrapper,
		});

		expect(result.current.isLoading).toBe(true);

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.data).toEqual(mockHistory);
		expect(getRoomStatusHistoryMock).toHaveBeenCalledWith({
			data: { roomName: "room-1", limit: 10 },
		});
		queryClient.clear();
	});

	it("uses custom limit when provided", async () => {
		getRoomStatusHistoryMock.mockResolvedValue(mockHistory);

		const { wrapper, queryClient } = createQueryClientWrapper();
		const { result } = renderHook(() => useRoomStatusHistory("room-1", 20), {
			wrapper,
		});

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(getRoomStatusHistoryMock).toHaveBeenCalledWith({
			data: { roomName: "room-1", limit: 20 },
		});
		queryClient.clear();
	});

	it("returns undefined data when fetch fails", async () => {
		getRoomStatusHistoryMock.mockRejectedValue(new Error("Failed to fetch"));

		const { wrapper, queryClient } = createQueryClientWrapper();
		const { result } = renderHook(() => useRoomStatusHistory("room-1"), {
			wrapper,
		});

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.data).toBeUndefined();
		queryClient.clear();
	});
});
