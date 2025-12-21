"use client";

import {
	createContext,
	useContext,
	useRef,
	useState,
	useEffect,
	useMemo,
	type ReactNode,
} from "react";
import {
	getPlayerState,
	savePlayerState,
	clearPlayerState,
	type PlayerState,
} from "~/lib/playerPersistence";
import type { Event } from "~/types/fosdem";

interface PlayerContextValue {
	videoRef: React.RefObject<HTMLVideoElement | null>;
	currentEvent: Event | null;
	year: number | null;
	isPlaying: boolean;
	isMuted: boolean;
	isMinimized: boolean;
	currentTime: number;
	volume: number;
	isLive: boolean;
	loadEvent: (event: Event, year: number, streamUrl: string, isLive: boolean) => void;
	play: () => void;
	pause: () => void;
	togglePlay: () => void;
	setVolume: (volume: number) => void;
	setMuted: (muted: boolean) => void;
	setCurrentTime: (time: number) => void;
	minimize: () => void;
	restore: () => void;
	close: () => void;
}

const PlayerContext = createContext<PlayerContextValue | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const pendingPlayRef = useRef(false);

	const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
	const [year, setYear] = useState<number | null>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [isMuted, setIsMuted] = useState(false);
	const [isMinimized, setIsMinimized] = useState(false);
	const [currentTime, setCurrentTimeState] = useState(0);
	const [volume, setVolumeState] = useState(1);
	const [isLive, setIsLive] = useState(false);
	const [streamUrl, setStreamUrl] = useState<string | null>(null);
	const [isClient, setIsClient] = useState(false);

	useEffect(() => {
		setIsClient(true);
	}, []);

	useEffect(() => {
		if (!isClient) return;
		const state = getPlayerState();
		if (state.eventSlug && state.streamUrl) {
			if (state.isMinimized && state.isPlaying) {
				const shouldRestore = window.confirm(
					`Continue playing "${state.eventTitle || "video"}" in floating player?`
				);

				if (!shouldRestore) {
					clearPlayerState();
					return;
				}
			}

			setYear(state.year);
			setIsMuted(state.isMuted);
			setIsMinimized(state.isMinimized);
			setVolumeState(state.volume);
			setIsLive(state.isLive);
			setStreamUrl(state.streamUrl);

			const restoredEvent: Event = {
				id: state.eventSlug,
				title: state.eventTitle || "Loading...",
				description: "",
				room: "",
				persons: [],
				startTime: "",
				duration: "",
				abstract: "",
				chat: "",
				links: state.streamUrl && !state.isLive
					? [{ href: state.streamUrl, title: "Recording", type: "video/webm" }]
					: [],
				attachments: [],
				streams: state.streamUrl && state.isLive
					? [{ href: state.streamUrl, title: "Live Stream", type: "application/vnd.apple.mpegurl" }]
					: [],
				day: "",
				trackKey: "",
				isLive: state.isLive,
				status: "",
				type: "",
				url: "",
				feedbackUrl: "",
				language: "",
			};

			setCurrentEvent(restoredEvent);
			setCurrentTimeState(state.currentTime);
			setIsPlaying(state.isPlaying);

			if (state.isPlaying && videoRef.current) {
				const playWhenReady = () => {
					if (videoRef.current) {
						videoRef.current.play().catch((error) => {
							console.error("Failed to auto-play restored video:", error);
							setIsPlaying(false);
						});
					}
				};

				if (videoRef.current.readyState >= 2) {
					playWhenReady();
				} else {
					videoRef.current.addEventListener("loadeddata", playWhenReady, { once: true });
				}
			}
		}
	}, [isClient]);

	useEffect(() => {
		const video = videoRef.current;
		if (!video || !currentEvent) return;

		const state = getPlayerState();
		if (state.currentTime > 0 && state.eventSlug === currentEvent.id) {
			const handleLoadedMetadata = () => {
				video.currentTime = state.currentTime;
			};

			if (video.readyState >= 1) {
				video.currentTime = state.currentTime;
			} else {
				video.addEventListener("loadedmetadata", handleLoadedMetadata);
				return () => {
					video.removeEventListener("loadedmetadata", handleLoadedMetadata);
				};
			}
		}
	}, [currentEvent]);

	useEffect(() => {
		if (currentEvent) {
			savePlayerState({
				eventSlug: currentEvent.id,
				year,
				currentTime,
				volume,
				isPlaying,
				isMuted,
				isMinimized,
				streamUrl,
				eventTitle: currentEvent.title,
				isLive,
			});
		}
	}, [currentEvent, year, volume, isPlaying, isMuted, isMinimized, streamUrl, isLive]);

	useEffect(() => {
		if (!currentEvent || !isPlaying) return;

		const interval = setInterval(() => {
			const video = videoRef.current;
			if (video) {
				savePlayerState({
					eventSlug: currentEvent.id,
					year,
					currentTime: video.currentTime,
					volume,
					isPlaying,
					isMuted,
					isMinimized,
					streamUrl,
					eventTitle: currentEvent.title,
					isLive,
				});
			}
		}, 5000);

		return () => clearInterval(interval);
	}, [currentEvent, year, volume, isPlaying, isMuted, isMinimized, streamUrl, isLive]);

	useEffect(() => {
		const video = videoRef.current;
		if (!video) return;

		const handleTimeUpdate = () => {
			setCurrentTimeState(video.currentTime);
		};

		const handleVolumeChange = () => {
			setVolumeState(video.volume);
			setIsMuted(video.muted);
		};

		const handlePlay = () => {
			setIsPlaying(true);
		};

		const handlePause = () => {
			setIsPlaying(false);
			if (currentEvent) {
				savePlayerState({
					eventSlug: currentEvent.id,
					year,
					currentTime: video.currentTime,
					volume: video.volume,
					isPlaying: false,
					isMuted: video.muted,
					isMinimized,
					streamUrl,
					eventTitle: currentEvent.title,
					isLive,
				});
			}
		};

		video.addEventListener("timeupdate", handleTimeUpdate);
		video.addEventListener("volumechange", handleVolumeChange);
		video.addEventListener("play", handlePlay);
		video.addEventListener("pause", handlePause);

		return () => {
			video.removeEventListener("timeupdate", handleTimeUpdate);
			video.removeEventListener("volumechange", handleVolumeChange);
			video.removeEventListener("play", handlePlay);
			video.removeEventListener("pause", handlePause);
		};
	}, [currentEvent, year, isMinimized, streamUrl, isLive]);

	const loadEvent = (
		event: Event,
		eventYear: number,
		url: string,
		live: boolean,
	) => {
		setCurrentEvent(event);
		setYear(eventYear);
		setStreamUrl(url);
		setIsLive(live);
		setIsMinimized(false);
	};

	const play = () => {
		pendingPlayRef.current = true;
		const video = videoRef.current;
		if (!video) {
			return;
		}
		const playPromise = video.play();
		if (playPromise?.catch) {
			playPromise.catch((error) => {
				console.error("Failed to play video:", error);
				pendingPlayRef.current = false;
				setIsPlaying(false);
			});
		}
	};

	const pause = () => {
		videoRef.current?.pause();
	};

	const togglePlay = () => {
		if (isPlaying) {
			pause();
		} else {
			play();
		}
	};

	useEffect(() => {
		if (!pendingPlayRef.current) return;
		const video = videoRef.current;
		if (!video) return;

		const playPromise = video.play();
		if (playPromise?.catch) {
			playPromise.catch((error) => {
				console.error("Failed to auto-play video:", error);
				pendingPlayRef.current = false;
				setIsPlaying(false);
			});
		}
		pendingPlayRef.current = false;
	}, [currentEvent, streamUrl, isLive]);

	const setVolume = (vol: number) => {
		if (videoRef.current) {
			videoRef.current.volume = vol;
		}
	};

	const setMuted = (muted: boolean) => {
		if (videoRef.current) {
			videoRef.current.muted = muted;
		}
	};

	const setCurrentTime = (time: number) => {
		if (videoRef.current) {
			videoRef.current.currentTime = time;
		}
	};

	const minimize = () => {
		setIsMinimized(true);
	};

	const restore = () => {
		setIsMinimized(false);
	};

	const close = () => {
		pause();
		setCurrentEvent(null);
		setYear(null);
		setStreamUrl(null);
		setIsMinimized(false);
		clearPlayerState();
	};

	const value: PlayerContextValue = useMemo(
		() => ({
			videoRef,
			currentEvent,
			year,
			isPlaying,
			isMuted,
			isMinimized,
			currentTime,
			volume,
			isLive,
			loadEvent,
			play,
			pause,
			togglePlay,
			setVolume,
			setMuted,
			setCurrentTime,
			minimize,
			restore,
			close,
		}),
		[
			currentEvent,
			year,
			isPlaying,
			isMuted,
			isMinimized,
			currentTime,
			volume,
			isLive,
		],
	);

	return (
		<PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
	);
}

export function usePlayer() {
	const context = useContext(PlayerContext);
	if (!context) {
		throw new Error("usePlayer must be used within PlayerProvider");
	}
	return context;
}
