"use client";

import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

import type { ConferenceData, Event } from "~/types/fosdem";
import { FeaturedFosdemImage } from "~/components/FeaturedFosdemImage";
import type { TypeIds } from "~/types/fosdem";
import { isEventLive, isEventFinished } from "~/lib/dateTime";
import { Icons } from "~/components/Icons";

type EventPlayerProps = {
	event: Event;
	conference: ConferenceData;
	videoRef: React.RefObject<HTMLVideoElement | null>;
	isMobile?: boolean;
	onClose?: () => void;
	isFloating?: boolean;
	testTime?: Date;
};

export function EventPlayer({
	event,
	conference,
	videoRef,
	isMobile = false,
	onClose,
	isFloating = false,
	testTime,
}: EventPlayerProps) {
	const hlsRef = useRef<Hls | null>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [streamError, setStreamError] = useState(false);

	const videoRecordings =
		event.links?.filter((link) => link.type?.startsWith("video/")) || [];
	const subtitleTrack = event.links?.find(
		(link) => link.href.endsWith(".vtt")
	);
	const proxiedSubtitleUrl = subtitleTrack
		? `/api/proxy/subtitles?url=${encodeURIComponent(subtitleTrack.href)}`
		: null;
	const hasRecordings = videoRecordings.length > 0;

	const eventIsLive =
		isEventLive(event, conference, testTime) &&
		event.streams?.some(
			(stream) => stream.type === "application/vnd.apple.mpegurl",
		);

	const eventIsInPast = isEventFinished(event, conference, testTime);

	useEffect(() => {
		if (!videoRef.current || !isPlaying) return;

		if (eventIsLive && event.streams?.length) {
			const hlsStream = event.streams.find(
				(stream) => stream.type === "application/vnd.apple.mpegurl",
			);

			if (hlsStream && Hls.isSupported()) {
				const hls = new Hls();
				hlsRef.current = hls;
				hls.attachMedia(videoRef.current);

				hls.on(Hls.Events.MEDIA_ATTACHED, () => {
					hls.loadSource(hlsStream.href);
				});

				hls.on(Hls.Events.ERROR, (event, data) => {
					if (data.fatal) {
						setStreamError(true);
					}
				});
			}
		}

		return () => {
			if (hlsRef.current) {
				hlsRef.current.destroy();
			}
		};
	}, [event.streams, isPlaying, videoRef, eventIsLive]);

	const handlePlay = () => {
		setIsPlaying(true);
		setStreamError(false);
	};

	const containerClassName = clsx("relative w-full", {
		"fixed right-0 bottom-14 w-[450px] max-w-[60vw] border-l border-t border-border":
			isFloating,
		"aspect-video": true,
	});

	const videoWrapperClassName = clsx(
		"flex items-center justify-center text-muted-foreground",
		"w-full h-full",
	);

	return (
		<div className={containerClassName}>
			{!isPlaying && (
				<FeaturedFosdemImage
					type={event.type as TypeIds}
					size="full"
					className="w-full h-full absolute top-0 left-0 z-0 object-cover"
					displayCaption={false}
				/>
			)}

			<div className={videoWrapperClassName}>
				{(eventIsLive && event.streams?.length) || hasRecordings ? (
					<>
						{!isPlaying && (
							<button
								type="button"
								onClick={handlePlay}
								className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/50 hover:bg-black/60 transition-colors"
							>
								<Icons.play className="w-16 h-16 text-white" />
								<span className="text-white text-lg font-medium">
									Play Video
								</span>
							</button>
						)}
						{isPlaying && !streamError && (
							<video
								ref={videoRef}
								className="w-full h-full object-contain"
								controls
								autoPlay
								playsInline
								webkit-playsinline="true"
							>
								{eventIsLive && event.streams?.length
									? event.streams.map((stream) => (
										<source
											key={stream.href}
											src={stream.href}
											type={stream.type}
										/>
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
						)}
						{streamError && (
							<div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50">
								<div className="p-4 md:p-6 mx-2 relative bg-muted rounded-md">
									<span className="text-sm md:text-base">
										{eventIsLive
											? "The live stream is currently unavailable. Please try again later."
											: "There was an error playing the recording. Please try again later."}
									</span>
								</div>
							</div>
						)}
					</>
				) : (
					<div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 transition-colors">
						<div className="p-4 md:p-6 mx-2 relative bg-muted rounded-md">
							<span className="text-sm md:text-base">
								{eventIsInPast
									? "This event has ended and no recording is available yet, it may be available in the future."
									: `The stream isn't available yet! Check back at ${event.startTime}.`}
							</span>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
