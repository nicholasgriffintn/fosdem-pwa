"use client";

import { useEffect, useRef } from "react";
import clsx from "clsx";
import type { Event } from "~/types/fosdem";

interface SharedVideoElementProps {
	event?: Event | null;
	sources?: Array<{ href: string; type: string }>;
	videoRef: React.RefObject<HTMLVideoElement | null>;
	isLive: boolean;
	showControls?: boolean;
	autoPlay?: boolean;
	className?: string;
}

export function SharedVideoElement({
	event,
	sources,
	videoRef,
	isLive,
	showControls = true,
	autoPlay = true,
	className,
}: SharedVideoElementProps) {
	const hlsRef = useRef<any>(null);

	const resolvedSources = sources?.length
		? sources
		: isLive
			? event?.streams ?? []
			: event?.links?.filter((link) => link.type?.startsWith("video/")) ?? [];

	const isHlsType = (type?: string) =>
		type === "application/vnd.apple.mpegurl" ||
		type === "application/x-mpegURL";

	const streamUrl = isLive
		? resolvedSources.find((source) =>
			isHlsType(source.type),
		)?.href
		: null;

	const resetVideo = (video: HTMLVideoElement) => {
		video.pause();
		video.removeAttribute("src");
		video.load();
	};

	useEffect(() => {
		if (!videoRef.current || !streamUrl) {
			return;
		}

		const video = videoRef.current;
		resetVideo(video);

		if (video.canPlayType("application/vnd.apple.mpegurl")) {
			video.src = streamUrl;
			return;
		}

		let cancelled = false;
		(async () => {
			const mod = await import("hls.js");
			if (cancelled) return;
			const Hls = mod.default;
			if (!Hls.isSupported()) return;

			if (hlsRef.current) {
				hlsRef.current.destroy();
			}

			const hls = new Hls({
				liveDurationInfinity: true,
				enableWorker: true,
				lowLatencyMode: true,
				backBufferLength: 90,
			});
			hlsRef.current = hls;
			hls.attachMedia(video);

			hls.on(Hls.Events.MEDIA_ATTACHED, () => {
				hls.loadSource(streamUrl);
			});

			hls.on(Hls.Events.ERROR, (_event: any, data: any) => {
				if (!data.fatal) return;

				switch (data.type) {
					case Hls.ErrorTypes.NETWORK_ERROR:
						hls.startLoad();
						break;

					case Hls.ErrorTypes.MEDIA_ERROR:
						hls.recoverMediaError();
						break;

					default:
						hls.destroy();
						break;
				}
			});
		})();

		return () => {
			cancelled = true;
			if (hlsRef.current) {
				hlsRef.current.destroy();
				hlsRef.current = null;
			}
		};
	}, [streamUrl]);

	if (!event && (!resolvedSources || resolvedSources.length === 0)) return null;

	const subtitleTrack = event?.links?.find((link) => link.href.endsWith(".vtt"));
	const proxiedSubtitleUrl = subtitleTrack
		? `/api/proxy/subtitles?url=${encodeURIComponent(subtitleTrack.href)}`
		: null;

	const sortedSources = [...resolvedSources].sort((a, b) => {
		if (a.type.includes("mp4")) return -1;
		if (b.type.includes("mp4")) return 1;
		return 0;
	});

	return (
		<video
			key={event?.id ?? streamUrl ?? "shared-video"}
			ref={videoRef}
			className={clsx("w-full h-full object-contain", className)}
			controls={showControls}
			autoPlay={autoPlay}
			playsInline
			webkit-playsinline="true"
			preload="metadata"
		>
			{!isLive && sortedSources.map((source) => (
				<source key={source.href} src={source.href} type={source.type} />
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
