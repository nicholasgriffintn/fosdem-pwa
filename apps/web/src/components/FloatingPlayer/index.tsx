"use client";

import { useEffect, useRef } from "react";
import Hls from "hls.js";
import { Icons } from "~/components/Icons";
import { usePlayer } from "~/contexts/PlayerContext";
import clsx from "clsx";

export function FloatingPlayer() {
	const {
		videoRef,
		currentEvent,
		year,
		isMinimized,
		minimize,
		restore,
		close,
		isLive,
	} = usePlayer();

	const hlsRef = useRef<Hls | null>(null);

	useEffect(() => {
		if (!currentEvent || !videoRef.current) return;

		const video = videoRef.current;

		if (isLive) {
			const hlsStream = currentEvent.streams?.find(
				(stream) => stream.type === "application/vnd.apple.mpegurl",
			);

			if (hlsStream && Hls.isSupported()) {
				const hls = new Hls();
				hlsRef.current = hls;
				hls.attachMedia(video);

				hls.on(Hls.Events.MEDIA_ATTACHED, () => {
					hls.loadSource(hlsStream.href);
				});

				hls.on(Hls.Events.ERROR, (_event, data) => {
					if (data.fatal) {
						console.error("HLS fatal error:", data);
					}
				});
			}
		} else {
			video.load();
		}

		return () => {
			if (hlsRef.current) {
				hlsRef.current.destroy();
				hlsRef.current = null;
			}
		};
	}, [currentEvent, videoRef, isLive]);

	if (!currentEvent || !year) {
		return null;
	}

	const videoRecordings =
		currentEvent.links?.filter((link) => link.type?.startsWith("video/")) || [];

	const subtitleTrack = currentEvent.links?.find((link) =>
		link.href.endsWith(".vtt"),
	);
	const proxiedSubtitleUrl = subtitleTrack
		? `/api/proxy/subtitles?url=${encodeURIComponent(subtitleTrack.href)}`
		: null;

	const containerClassName = clsx(
		"fixed z-50 transition-all duration-300 ease-in-out",
		{
			"bottom-14 right-4 w-80 h-12 bg-background border border-border rounded-lg shadow-xl":
				isMinimized,
			"bottom-14 right-4 w-[450px] max-w-[60vw] aspect-video border border-border rounded-lg shadow-2xl overflow-hidden bg-black":
				!isMinimized,
		},
	);

	return (
		<div className={containerClassName}>
			{isMinimized && (
				<div className="flex items-center justify-between h-full px-4">
					<div className="flex items-center gap-2 flex-1 min-w-0">
						<Icons.play className="w-4 h-4 text-muted-foreground flex-shrink-0" />
						<span className="text-sm font-medium truncate">
							{currentEvent.title}
						</span>
					</div>
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={restore}
							className="p-1 hover:bg-muted rounded transition-colors"
							title="Restore player"
						>
							<Icons.chevronUp className="w-4 h-4" />
						</button>
						<button
							type="button"
							onClick={close}
							className="p-1 hover:bg-muted rounded transition-colors"
							title="Close player"
						>
							<Icons.x className="w-4 h-4" />
						</button>
					</div>
				</div>
			)}

			{!isMinimized && (
				<div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-2 bg-gradient-to-b from-black/80 to-transparent">
					<a
						href={`/event/${currentEvent.id}?year=${year}`}
						className="text-sm font-medium text-white hover:underline truncate flex-1 min-w-0 pr-2"
					>
						{currentEvent.title}
					</a>
					<div className="flex items-center gap-1 flex-shrink-0">
						<button
							type="button"
							onClick={minimize}
							className="p-1.5 hover:bg-white/20 rounded transition-colors"
							title="Minimize player"
						>
							<Icons.chevronDown className="w-4 h-4 text-white" />
						</button>
						<button
							type="button"
							onClick={close}
							className="p-1.5 hover:bg-white/20 rounded transition-colors"
							title="Close player"
						>
							<Icons.x className="w-4 h-4 text-white" />
						</button>
					</div>
				</div>
			)}

			<video
				ref={videoRef}
				className={clsx("w-full h-full object-contain", {
					hidden: isMinimized,
				})}
				controls={!isMinimized}
				autoPlay
				playsInline
				webkit-playsinline="true"
			>
				{isLive && currentEvent.streams?.length
					? currentEvent.streams.map((stream) => (
							<source key={stream.href} src={stream.href} type={stream.type} />
						))
					: videoRecordings.map((recording) => (
							<source
								key={recording.href}
								src={recording.href}
								type={recording.type}
							/>
						))}
				{proxiedSubtitleUrl && (
					<track
						kind="subtitles"
						src={proxiedSubtitleUrl}
						srcLang="en"
						label="English"
						default
					/>
				)}
			</video>
		</div>
	);
}
