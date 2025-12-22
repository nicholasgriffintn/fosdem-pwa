"use client";

import clsx from "clsx";
import { useState } from "react";

import { Icons } from "~/components/Icons";
import { constants } from "~/constants";
import { Image } from "~/components/Image";
import { useOnlineStatus } from "~/hooks/use-online-status";
import { SharedVideoElement } from "~/components/VideoPlayer/SharedVideoElement";
import { NoJsVideoFallback } from "~/components/VideoPlayer/NoJsVideoFallback";

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
	const [isPlaying, setIsPlaying] = useState(false);
	const [streamError, setStreamError] = useState(false);
	const isOnline = useOnlineStatus();
	const streamUrl = constants.STREAM_LINK.replace("${ROOM_ID}", roomId);
	const streamSources = [
		{ href: streamUrl, type: "application/vnd.apple.mpegurl" },
	];

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
			{(!isPlaying || !isOnline) && (
				<Image
					src="/images/fosdem/full/fallback.png"
					alt="The FOSDEM logo"
					className="w-full h-full absolute top-0 left-0 z-0 object-cover"
				/>
			)}

			<div className={videoWrapperClassName}>
				<div className="js-only w-full h-full">
					{!isPlaying && isOnline && (
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
						<SharedVideoElement
							sources={streamSources}
							videoRef={videoRef}
							isLive={true}
							showControls={true}
							className="w-full h-full"
						/>
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
					{!isOnline && (
						<div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
							<div className="p-4 md:p-6 mx-2 relative bg-muted rounded-md text-center space-y-2">
								<p className="text-sm md:text-base font-medium">
									You are offline. Live streams are unavailable.
								</p>
								<a
									className="text-sm text-primary underline"
									href="/offline"
									rel="noreferrer"
								>
									View offline schedule
								</a>
							</div>
						</div>
					)}
				</div>
				<div className="no-js-only w-full h-full">
					<NoJsVideoFallback
						openUrl={streamUrl}
						backgroundImageUrl="/images/fosdem/full/fallback.png"
						sources={[{ href: streamUrl, type: "application/vnd.apple.mpegurl" }]}
					/>
				</div>
			</div>
		</div>
	);
}
