import { render, waitFor } from "@testing-library/react";
import { createRef } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { VideoProgressTracker } from "~/components/VideoPlayer/VideoProgressTracker";

const playerModule = vi.hoisted(() => ({
	usePlayer: vi.fn(),
}));

vi.mock("~/contexts/PlayerContext", () => playerModule);

const bookmarkModule = vi.hoisted(() => ({
	useBookmark: vi.fn(),
}));

vi.mock("~/hooks/use-bookmark", () => bookmarkModule);

const watchLaterModule = vi.hoisted(() => ({
	useWatchLater: vi.fn(),
}));

vi.mock("~/hooks/use-watch-later", () => watchLaterModule);

const usePlayerMock = vi.mocked(playerModule.usePlayer);
const useBookmarkMock = vi.mocked(bookmarkModule.useBookmark);
const useWatchLaterMock = vi.mocked(watchLaterModule.useWatchLater);

describe("VideoProgressTracker", () => {
	beforeEach(() => {
		usePlayerMock.mockReset();
		useBookmarkMock.mockReset();
		useWatchLaterMock.mockReset();
		useWatchLaterMock.mockReturnValue({
			updateProgress: vi.fn(),
			markAsWatched: vi.fn(),
		} as any);
	});

	it("restores saved progress when playback is behind", async () => {
		const videoRef = createRef<HTMLVideoElement>();
		const video = {
			currentTime: 0,
			duration: 300,
			readyState: 1,
			playbackRate: 1,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		} as unknown as HTMLVideoElement;
		videoRef.current = video;

		usePlayerMock.mockReturnValue({
			videoRef,
			currentEvent: { id: "event-1" },
			year: 2024,
			isPlaying: true,
			isLive: false,
		} as any);

		useBookmarkMock.mockReturnValue({
			bookmark: { watch_progress_seconds: 120 },
			loading: false,
		} as any);

		render(<VideoProgressTracker />);

		await waitFor(() => {
			expect(video.currentTime).toBe(120);
		});
	});

	it("does not rewind when playback is already ahead", async () => {
		const videoRef = createRef<HTMLVideoElement>();
		const video = {
			currentTime: 130,
			duration: 300,
			readyState: 1,
			playbackRate: 1,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		} as unknown as HTMLVideoElement;
		videoRef.current = video;

		usePlayerMock.mockReturnValue({
			videoRef,
			currentEvent: { id: "event-1" },
			year: 2024,
			isPlaying: true,
			isLive: false,
		} as any);

		useBookmarkMock.mockReturnValue({
			bookmark: { watch_progress_seconds: 120 },
			loading: false,
		} as any);

		render(<VideoProgressTracker />);

		await waitFor(() => {
			expect(video.currentTime).toBe(130);
		});
	});
	it("saves the previous event and restores the next event when switching videos", () => {
		const updateProgress = vi.fn();
		useWatchLaterMock.mockReturnValue({
			updateProgress,
			markAsWatched: vi.fn(),
		});
		const firstVideo = document.createElement("video");
		firstVideo.currentTime = 60;
		const videoRef = createRef<HTMLVideoElement>();
		videoRef.current = firstVideo;
		const player = {
			videoRef,
			currentEvent: { id: "first" },
			year: 2024,
			isPlaying: false,
			isLive: false,
		};
		usePlayerMock.mockReturnValue(player);
		useBookmarkMock.mockReturnValue({
			bookmark: { serverId: "first-bookmark" },
		});
		const { rerender } = render(<VideoProgressTracker />);

		const nextVideo = document.createElement("video");
		Object.defineProperties(nextVideo, {
			duration: { value: 300 },
			readyState: { value: 1 },
		});
		videoRef.current = nextVideo;
		usePlayerMock.mockReturnValue({ ...player, currentEvent: { id: "next" } });
		useBookmarkMock.mockReturnValue({
			bookmark: { serverId: "next-bookmark", watch_progress_seconds: 120 },
		});
		rerender(<VideoProgressTracker />);

		expect(updateProgress).toHaveBeenCalledWith({
			bookmarkId: "first-bookmark",
			progressSeconds: 60,
			playbackSpeed: "1",
		});
		expect(nextVideo.currentTime).toBe(120);
	});
});
