import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RoomStatus } from "~/components/Room/RoomStatus";

const roomStatusModule = vi.hoisted(() => ({
	useRoomStatus: vi.fn(),
}));

const roomStatusHistoryModule = vi.hoisted(() => ({
	useRoomStatusHistory: vi.fn(),
}));

vi.mock("~/hooks/use-room-status", () => roomStatusModule);
vi.mock("~/hooks/use-room-status-history", () => roomStatusHistoryModule);

const useRoomStatusMock = vi.mocked(roomStatusModule.useRoomStatus);
const useRoomStatusHistoryMock = vi.mocked(roomStatusHistoryModule.useRoomStatusHistory);

describe("RoomStatus", () => {
	it("renders the current room state", () => {
		useRoomStatusMock.mockReturnValue({
			data: { state: "available", lastUpdate: new Date().toISOString() },
			isLoading: false,
		});
		useRoomStatusHistoryMock.mockReturnValue({
			data: null,
			isLoading: true,
		});

		render(<RoomStatus roomId="room-1" />);

		expect(screen.getByText(/Room Status/i)).toBeInTheDocument();
		expect(screen.getByText(/available/i)).toBeInTheDocument();
	});
});
