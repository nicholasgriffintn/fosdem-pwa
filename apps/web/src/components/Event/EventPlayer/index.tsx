"use client";

import clsx from "clsx";
import { useState, useEffect } from "react";

import type { ConferenceData, Event } from "~/types/fosdem";
import { FeaturedFosdemImage } from "~/components/FeaturedFosdemImage";
import type { TypeIds } from "~/types/fosdem";
import { isEventLive } from "~/lib/dateTime";
import { EventPlayerNotStarted } from "./components/NotStarted";
import { EventPlayerStarted } from "./components/Started";
import { useOnlineStatus } from "~/hooks/use-online-status";
import { usePlayer } from "~/contexts/PlayerContext";
import { Icons } from "~/components/Icons";

type EventPlayerProps = {
	event: Event;
	conference: ConferenceData;
	videoRef: React.RefObject<HTMLVideoElement | null>;
	isFloating?: boolean;
	testTime?: Date;
	year?: number;
};

export function EventPlayer({
	event,
	conference,
	videoRef,
	isFloating = false,
	testTime,
	year = new Date().getFullYear(),
}: EventPlayerProps) {
	const [isPlaying, setIsPlaying] = useState(false);
	const [isMounted, setIsMounted] = useState(false);
	const isOnline = useOnlineStatus();
	const player = usePlayer();

	useEffect(() => {
		setIsMounted(true);
	}, []);

	const videoRecordings =
		event.links?.filter((link) => link.type?.startsWith("video/")) || [];
	const hasRecordings = videoRecordings.length > 0;

	const eventIsLive =
		isEventLive(event, conference, testTime) &&
		event.streams?.some(
			(stream) => stream.type === "application/vnd.apple.mpegurl",
		);

	const streamUrl = eventIsLive
		? event.streams?.find(
				(stream) => stream.type === "application/vnd.apple.mpegurl",
			)?.href ?? videoRecordings[0]?.href ?? null
		: videoRecordings[0]?.href ?? null;

	const containerClassName = clsx("relative w-full", {
		"fixed right-0 bottom-14 w-[450px] max-w-[60vw] border-l border-t border-border":
			isFloating,
		"aspect-video": true,
	});

	const videoWrapperClassName = clsx(
		"flex items-center justify-center text-muted-foreground",
		"w-full h-full",
	);

	const handlePopOut = () => {
		if (streamUrl) {
			setIsPlaying(false);
			if (videoRef.current) {
				videoRef.current.pause();
			}
			player.loadEvent(event, year, streamUrl, eventIsLive);
			player.play();
		}
	};

	useEffect(() => {
		if (isPlaying && player.currentEvent?.id === event?.id) {
			player.close();
		}
	}, [isPlaying, player, event?.id]);

	return (
		<div className={clsx(containerClassName, "group")}>
			{!isPlaying && (
				<FeaturedFosdemImage
					type={event.type as TypeIds}
					size="full"
					className="w-full h-full absolute top-0 left-0 z-0 object-cover"
					displayCaption={false}
				/>
			)}

			{((eventIsLive && event.streams?.length) || hasRecordings) && (
				<button
					type="button"
					onClick={handlePopOut}
					className="absolute top-2 right-2 z-20 p-2 bg-black/60 hover:bg-black/80 text-white rounded-md transition-all flex items-center gap-2 opacity-0 group-hover:opacity-100"
					title="Pop out player"
				>
					<Icons.externalLink className="w-4 h-4" />
					<span className="text-sm font-medium">Pop Out</span>
				</button>
			)}

			<div className={videoWrapperClassName}>
				{(eventIsLive && event.streams?.length) || hasRecordings ? (
					<EventPlayerStarted
						event={event}
						videoRef={videoRef}
						isPlaying={isPlaying}
						setIsPlaying={setIsPlaying}
						eventIsLive={eventIsLive}
					/>
				) : (
					<EventPlayerNotStarted
						event={event}
						conference={conference}
						testTime={testTime ?? new Date()}
					/>
				)}
				{isMounted && !isOnline && (
					<div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
						<div className="p-4 md:p-6 mx-2 relative bg-muted rounded-md text-center space-y-2">
							<p className="text-sm md:text-base font-medium text-foreground">
								You are offline. Live video will start once you reconnect.
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
		</div>
	);
}
