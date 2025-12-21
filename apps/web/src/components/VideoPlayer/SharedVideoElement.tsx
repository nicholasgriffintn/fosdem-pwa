"use client";

import { useEffect, useRef } from "react";
import Hls from "hls.js";
import clsx from "clsx";
import type { Event } from "~/types/fosdem";

interface SharedVideoElementProps {
	event: Event | null;
	videoRef: React.RefObject<HTMLVideoElement | null>;
	isLive: boolean;
	showControls?: boolean;
	className?: string;
}

export function SharedVideoElement({
	event,
	videoRef,
	isLive,
	showControls = true,
	className,
}: SharedVideoElementProps) {
	const hlsRef = useRef<Hls | null>(null);

	const streamUrl = isLive
		? event?.streams?.find((s) => s.type === "application/vnd.apple.mpegurl")?.href
		: event?.links?.find((l) => l.type?.startsWith("video/"))?.href;

	useEffect(() => {
		if (!streamUrl || !videoRef.current) return;

		const video = videoRef.current;

		if (isLive && Hls.isSupported()) {
			if (hlsRef.current) {
				hlsRef.current.destroy();
			}

			const hls = new Hls();
			hlsRef.current = hls;
			hls.attachMedia(video);

			hls.on(Hls.Events.MEDIA_ATTACHED, () => {
				hls.loadSource(streamUrl);
			});

			hls.on(Hls.Events.ERROR, (_event, data) => {
				if (data.fatal) {
					console.error("HLS fatal error:", data);
				}
			});
		}

		return () => {
			if (hlsRef.current) {
				hlsRef.current.destroy();
				hlsRef.current = null;
			}
		};
	}, [streamUrl, isLive]);

	if (!event) return null;

	const videoRecordings =
		event.links?.filter((link) => link.type?.startsWith("video/")) || [];

	const subtitleTrack = event.links?.find((link) =>
		link.href.endsWith(".vtt"),
	);
	const proxiedSubtitleUrl = subtitleTrack
		? `/api/proxy/subtitles?url=${encodeURIComponent(subtitleTrack.href)}`
		: null;

	return (
		<video
			ref={videoRef}
			className={clsx("w-full h-full object-contain", className)}
			controls={showControls}
			autoPlay
			playsInline
			webkit-playsinline="true"
		>
			{isLive && event.streams?.length
				? event.streams.map((stream) => (
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
	);
}
