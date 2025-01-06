"use client";

import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

import { Icons } from "~/components/Icons";
import { constants } from "~/constants";
import { Image } from "~/components/Image";

type RoomPlayerProps = {
	roomId: string;
	videoRef: React.RefObject<HTMLVideoElement | null>;
	isMobile?: boolean;
	onClose?: () => void;
	isFloating?: boolean;
};

export function RoomPlayer({
	roomId,
	videoRef,
	isMobile = false,
	onClose,
	isFloating = false,
}: RoomPlayerProps) {
	const hlsRef = useRef<Hls | null>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [streamError, setStreamError] = useState(false);

	useEffect(() => {
		if (!videoRef.current || !isPlaying) return;

		const streamUrl = constants.STREAM_LINK.replace("${ROOM_ID}", roomId);

		if (Hls.isSupported()) {
			const hls = new Hls();
			hlsRef.current = hls;
			hls.attachMedia(videoRef.current);

			hls.on(Hls.Events.MEDIA_ATTACHED, () => {
				hls.loadSource(streamUrl);
			});

			hls.on(Hls.Events.ERROR, (event, data) => {
				if (data.fatal) {
					setStreamError(true);
				}
			});
		}

		return () => {
			if (hlsRef.current) {
				hlsRef.current.destroy();
			}
		};
	}, [roomId, isPlaying, videoRef]);

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
				<Image
					src="/images/fosdem/full/fallback.png"
					alt="The FOSDEM logo"
					className="w-full h-full absolute top-0 left-0 z-0 object-cover"
				/>
			)}

			<div className={videoWrapperClassName}>
				{!isPlaying && (
					<button
						type="button"
						onClick={handlePlay}
						className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/50 hover:bg-black/60 transition-colors"
					>
						<Icons.play className="w-16 h-16 text-white" />
						<span className="text-white text-lg font-medium">
							Watch Room Stream
						</span>
					</button>
				)}
				{isPlaying && (
					// biome-ignore lint/a11y/useMediaCaption: We don't have captions for the streams
					<video
						ref={videoRef}
						className="w-full h-full object-contain"
						controls
						autoPlay
						playsInline
						webkit-playsinline="true"
					>
						<source
							src={constants.STREAM_LINK.replace("${ROOM_ID}", roomId)}
							type="application/vnd.apple.mpegurl"
						/>
					</video>
				)}
				{streamError && (
					<div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50">
						<div className="p-4 md:p-6 mx-2 relative bg-muted rounded-md">
							<span className="text-sm md:text-base">
								The stream is currently unavailable. The room might not be
								streaming at the moment.
							</span>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
