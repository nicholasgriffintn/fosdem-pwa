"use client";

import { useEffect, useRef, useState } from "react";

import { FeaturedFosdemImage } from "~/components/shared/FeaturedFosdemImage";
import { Icons } from "~/components/shared/Icons";
import { NoJsVideoFallback } from "~/components/VideoPlayer/NoJsVideoFallback";
import { usePlayer } from "~/contexts/PlayerContext";
import { useOnlineStatus } from "~/hooks/use-online-status";
import { isEventLive } from "~/lib/dateTime";
import { PlaybackSpeedControl } from "~/components/WatchLater/PlaybackSpeedControl";
import type { ConferenceData, Event, TypeIds } from "~/types/fosdem";
import { EventPlayerNotStarted } from "~/components/Event/EventPlayer/components/NotStarted";

type EventPlayerProps = {
	event: Event;
	conference: ConferenceData;
	testTime?: Date;
	year?: number;
};

export function EventPlayer({
	event,
	conference,
	testTime,
	year = new Date().getFullYear(),
}: EventPlayerProps) {
	const [isMounted, setIsMounted] = useState(false);
	const isOnline = useOnlineStatus();
	const player = usePlayer();
	const lastStateRef = useRef<{
		isPlaying: boolean;
		portalTarget: typeof player.portalTarget;
		currentEventId: string | null;
		setPortalTarget: typeof player.setPortalTarget;
	}>({
		isPlaying: false,
		portalTarget: player.portalTarget,
		currentEventId: player.currentEvent?.id ?? null,
		setPortalTarget: player.setPortalTarget,
	});

	const handleSpeedChange = (speed: number) => {
		if (player.videoRef.current) {
			player.videoRef.current.playbackRate = speed;
		}
	};

	const currentSpeed = player.videoRef.current?.playbackRate ?? 1;

	useEffect(() => {
		setIsMounted(true);
	}, []);

	lastStateRef.current = {
		isPlaying: player.isPlaying,
		portalTarget: player.portalTarget,
		currentEventId: player.currentEvent?.id ?? null,
		setPortalTarget: player.setPortalTarget,
	};

	useEffect(() => {
		const eventId = event.id;
		return () => {
			const { isPlaying, portalTarget, currentEventId, setPortalTarget } =
				lastStateRef.current;
			if (
				isPlaying &&
				portalTarget === "event-page" &&
				currentEventId === eventId
			) {
				setPortalTarget("floating");
			}
		};
	}, [event.id]);

	const videoRecordings =
		event.links?.filter((link) => link.type?.startsWith("video/")) || [];
	const hasRecordings = videoRecordings.length > 0;

	const eventIsLive =
		isEventLive(event, conference, testTime) &&
		event.streams?.some(
			(stream) => stream.type === "application/vnd.apple.mpegurl",
		);

	const streamUrl = eventIsLive
		? (event.streams?.find(
				(stream) => stream.type === "application/vnd.apple.mpegurl",
			)?.href ??
			videoRecordings[0]?.href ??
			null)
		: (videoRecordings[0]?.href ?? null);

	const subtitleTrack = event.links?.find((link) => link.href.endsWith(".vtt"));
	const proxiedSubtitleUrl = subtitleTrack
		? `/api/proxy/subtitles?url=${encodeURIComponent(subtitleTrack.href)}`
		: null;

	const isThisEventPlaying =
		player.currentEvent?.id === event.id &&
		player.portalTarget === "event-page";
	const isThisEventFloating =
		player.currentEvent?.id === event.id && player.portalTarget === "floating";
	const hasPlayableMedia =
		(eventIsLive && event.streams?.length) || hasRecordings;

	const handlePlay = () => {
		if (streamUrl) {
			player.setPortalTarget("event-page");
			player.loadEvent(event, year, streamUrl, eventIsLive);
			player.play();
		}
	};

	const handlePopOut = () => {
		if (streamUrl) {
			if (!player.currentEvent || player.currentEvent.id !== event.id) {
				player.loadEvent(event, year, streamUrl, eventIsLive);
			}
			player.setPortalTarget("floating");
			player.play();
		}
	};

	const handlePopBackIn = () => {
		if (streamUrl) {
			if (!player.currentEvent || player.currentEvent.id !== event.id) {
				player.loadEvent(event, year, streamUrl, eventIsLive);
			}
			player.setPortalTarget("event-page");
			if (player.isPlaying) {
				player.play();
			}
		}
	};

	return (
		<div className="relative w-full aspect-video group">
			{!isThisEventPlaying && (
				<FeaturedFosdemImage
					type={event.type as TypeIds}
					size="full"
					className="w-full h-full absolute top-0 left-0 z-0 object-cover"
					displayCaption={false}
				/>
			)}

			{hasPlayableMedia && !isThisEventFloating && (
				<button
					type="button"
					onClick={handlePopOut}
					className="js-required absolute top-2 right-2 z-20 p-2 bg-black/60 hover:bg-black/80 text-white rounded-md transition-all flex items-center gap-2 opacity-0 group-hover:opacity-100"
					title="Pop out player"
				>
					<Icons.externalLink className="w-4 h-4" />
					<span className="text-sm font-medium">Pop Out</span>
				</button>
			)}

			<div className="flex items-center justify-center text-muted-foreground w-full h-full">
				{hasPlayableMedia ? (
					<>
						<div className="js-only w-full h-full">
							{!isThisEventPlaying && (
								<button
									type="button"
									onClick={isThisEventFloating ? handlePopBackIn : handlePlay}
									className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/50 hover:bg-black/60 transition-colors"
								>
									{isThisEventFloating ? (
										<Icons.chevronUp className="w-16 h-16 text-white" />
									) : (
										<Icons.play className="w-16 h-16 text-white" />
									)}
									<span className="text-white text-lg font-medium">
										{isThisEventFloating ? "Pop Back In" : "Play Video"}
									</span>
								</button>
							)}
							<div id="event-page-video-portal" className="w-full h-full" />
							{isThisEventPlaying && !eventIsLive && (
								<div className="absolute top-2 left-2 z-20 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
									<PlaybackSpeedControl
										currentSpeed={currentSpeed}
										onSpeedChange={handleSpeedChange}
										variant="icon"
										className="text-white bg-black/60 hover:bg-black/80"
									/>
								</div>
							)}
							{isMounted && !isOnline && (
								<div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
									<div className="p-4 md:p-6 mx-2 relative bg-muted rounded-md text-center space-y-2">
										<p className="text-sm md:text-base font-medium text-foreground">
											You are offline. Live video will start once you reconnect.
										</p>
									</div>
								</div>
							)}
						</div>
						<div className="no-js-only absolute inset-0 z-10">
							{streamUrl ? (
								<NoJsVideoFallback
									openUrl={streamUrl}
									backgroundImageUrl="/fosdem/images/fosdem/full/fallback.png"
									subtitleUrl={proxiedSubtitleUrl}
									sources={[
										...(eventIsLive
											? [
													{
														href: streamUrl,
														type: "application/vnd.apple.mpegurl",
													},
												]
											: []),
										...videoRecordings,
									]}
								/>
							) : (
								<p className="text-sm text-muted-foreground">
									No video available.
								</p>
							)}
						</div>
					</>
				) : (
					<EventPlayerNotStarted
						event={event}
						conference={conference}
						testTime={testTime ?? new Date()}
					/>
				)}
			</div>
		</div>
	);
}
