"use client";

import clsx from "clsx";
import { useState } from "react";

import type { ConferenceData, Event } from "~/types/fosdem";
import { FeaturedFosdemImage } from "~/components/FeaturedFosdemImage";
import type { TypeIds } from "~/types/fosdem";
import { isEventLive } from "~/lib/dateTime";
import { EventPlayerNotStarted } from "./components/NotStarted";
import { EventPlayerStarted } from "./components/Started";

type EventPlayerProps = {
	event: Event;
	conference: ConferenceData;
	videoRef: React.RefObject<HTMLVideoElement | null>;
	isFloating?: boolean;
	testTime?: Date;
};

export function EventPlayer({
	event,
	conference,
	videoRef,
	isFloating = false,
	testTime,
}: EventPlayerProps) {
	const [isPlaying, setIsPlaying] = useState(false);

	const videoRecordings =
		event.links?.filter((link) => link.type?.startsWith("video/")) || [];
	const hasRecordings = videoRecordings.length > 0;

	const eventIsLive =
		isEventLive(event, conference, testTime) &&
		event.streams?.some(
			(stream) => stream.type === "application/vnd.apple.mpegurl",
		);

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
			</div>
		</div>
	);
}
