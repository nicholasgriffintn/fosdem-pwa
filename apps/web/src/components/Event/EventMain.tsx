"use client";

import { useRef } from "react";

import { cn } from "~/lib/utils";
import { EventSidebar } from "~/components/Event/EventSidebar";
import { EventPlayer } from "~/components/Event/EventPlayer";
import { ChatAlert } from "~/components/Event/ChatAlert";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "~/components/ui/resizable";
import { useWindowSize } from "~/hooks/use-window-size";
import type { Event, ConferenceData, TypeIds } from "~/types/fosdem";
import { fosdemImageDetails } from "~/data/fosdem-image-details";
import { fosdemSpecialRooms } from "~/data/fosdem-special-rooms";
import { EventContent } from "~/components/Event/EventContent";

type EventMainProps = {
	event: Event;
	conference: ConferenceData;
	year: number;
	isTest?: boolean;
};

export function EventMain({ event, conference, year, isTest }: EventMainProps) {
	const roomType = event.room?.[0];
	const specialRoom =
		roomType && fosdemSpecialRooms[roomType as keyof typeof fosdemSpecialRooms];
	const testTime = isTest ? new Date(conference.start) : undefined;
	const imageDetails = fosdemImageDetails[event.type as TypeIds];

	const videoRef = useRef<HTMLVideoElement>(null);
	const { width } = useWindowSize();
	const isMobile = typeof window !== "undefined" ? width < 768 : false;

	if (specialRoom) {
		return (
			<div className="space-y-4">
				<div className="prose prose-lg prose-indigo text-foreground">
					{specialRoom.description(year)}
				</div>
				{event.chat && (
					<div className="border rounded-md overflow-hidden">
						<ChatAlert chatUrl={event.chat} />
					</div>
				)}
				<EventContent event={event} />
			</div>
		);
	}

	return (
		<>
			<ResizablePanelGroup
				direction={isMobile ? "vertical" : "horizontal"}
				className={cn("rounded-lg", {
					"!flex-col": isMobile,
					"min-h-[200px] border": !isMobile,
				})}
			>
				<ResizablePanel
					defaultSize={isMobile ? 100 : 75}
					className={cn({
						"!w-full !flex-[1_1_auto]": isMobile,
					})}
				>
					<div className="h-full flex flex-col">
						<div className="flex-1">
							<EventPlayer
								event={event}
								conference={conference}
								videoRef={videoRef}
								isMobile={isMobile}
								testTime={testTime}
							/>
						</div>
						{event.chat && <ChatAlert chatUrl={event.chat} />}
					</div>
				</ResizablePanel>
				{!isMobile && <ResizableHandle withHandle />}
				<ResizablePanel
					defaultSize={25}
					className={cn({
						"!w-full mt-4 !flex-[1_1_auto]": isMobile,
					})}
				>
					<EventSidebar
						event={event}
						year={year}
						videoRef={videoRef}
						isMobile={isMobile}
					/>
				</ResizablePanel>
			</ResizablePanelGroup>
			<div className="w-full">
				<EventContent event={event} />
				<div className="mt-4">
					{(event.abstract || event.links?.length > 0) && (
						<hr className="my-4" />
					)}
					<span className="text-sm block mb-2">
						Notice: The placeholder video image is licensed under{" "}
						{imageDetails?.license ?? "the stated license by the content owner"}.{" "}
						{imageDetails?.original ? (
							<a href={imageDetails.original} target="_blank" rel="noreferrer">
								The original image can be found here
							</a>
						) : (
							<span>The original image link is unavailable.</span>
						)}
					</span>
					{imageDetails?.changes && (
						<span className="text-xs block mt-1">
							Changes made to the image are: {imageDetails.changes}
						</span>
					)}
				</div>
			</div>
		</>
	);
}
