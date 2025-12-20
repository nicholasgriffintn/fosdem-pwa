import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRef } from "react";

import { RoomPlayer } from "~/components/Room/RoomPlayer";

const onlineStatusModule = vi.hoisted(() => ({
	useOnlineStatus: vi.fn(),
}));

vi.mock("~/hooks/use-online-status", () => onlineStatusModule);

const useOnlineStatusMock = vi.mocked(onlineStatusModule.useOnlineStatus);

const MockHls = vi.hoisted(() => {
	return class {
		// @ts-ignore
		static Events = {
			MEDIA_ATTACHED: "MEDIA_ATTACHED",
			ERROR: "ERROR",
		};
		static isSupported() {
			return true;
		}
		on() { }
		attachMedia() { }
		loadSource() { }
		destroy() { }
	};
});

vi.mock("hls.js", () => ({
	default: MockHls,
}));

describe("RoomPlayer", () => {
	beforeEach(() => {
		useOnlineStatusMock.mockReset();
	});

	it("plays the stream when the user clicks play", () => {
		useOnlineStatusMock.mockReturnValue(true);
		const videoRef = createRef<HTMLVideoElement>();

		render(
			<RoomPlayer
				roomId="aw112"
				videoRef={videoRef}
				isMobile={false}
				isFloating={false}
			/>,
		);

		const playButton = screen.getByRole("button", { name: /watch room stream/i });
		fireEvent.click(playButton);

		expect(document.querySelector("video")).toBeInTheDocument();
	});

	it("shows offline messaging when offline", () => {
		useOnlineStatusMock.mockReturnValue(false);

		render(
			<RoomPlayer
				roomId="aw112"
				videoRef={createRef<HTMLVideoElement>()}
				isMobile={false}
				isFloating={false}
			/>,
		);

		expect(
			screen.getByText(/You are offline. Live streams are unavailable./i),
		).toBeInTheDocument();
	});
});
