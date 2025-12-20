import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RoomStatus } from "~/components/Room/RoomStatus";

const roomStatusModule = vi.hoisted(() => ({
	useRoomStatus: vi.fn(),
}));

vi.mock("~/hooks/use-room-status", () => roomStatusModule);

const useRoomStatusMock = vi.mocked(roomStatusModule.useRoomStatus);

describe("RoomStatus", () => {
	it("renders the current room state", () => {
		useRoomStatusMock.mockReturnValue({
			data: { state: "available", lastUpdate: new Date().toISOString() },
			isLoading: false,
		});

		render(<RoomStatus roomId="room-1" />);

		expect(screen.getByText(/Room Status/i)).toBeInTheDocument();
		expect(screen.getByText(/available/i)).toBeInTheDocument();
	});
});
