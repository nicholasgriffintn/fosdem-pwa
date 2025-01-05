"use client";

import { useRef } from "react";
import { cn } from "~/lib/utils";

import { EventSidebar } from "~/components/EventSidebar";
import { EventPlayer } from "~/components/EventPlayer";
import { ChatAlert } from "~/components/ChatAlert";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "~/components/ui/resizable";
import { useWindowSize } from "~/hooks/use-window-size";
import type { Event, ConferenceData, TypeIds } from "~/types/fosdem";
import { fosdemImageDetails } from "~/data/fosdem-image-details";
import { fosdemSpecialRooms } from "~/data/fosdem-special-rooms";
import { EventContent } from "~/components/EventContent";

export function EventMain({
	event,
	conference,
	year,
}: { event: Event; conference: ConferenceData; year: number }) {
	console.log(event);
	const roomType = event.room?.[0];
	const specialRoom = roomType && fosdemSpecialRooms[roomType as keyof typeof fosdemSpecialRooms];

	if (specialRoom) {
		return (
			<div className="space-y-4">
				<div className="prose prose-lg prose-indigo">
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

	const videoRef = useRef<HTMLVideoElement>(null);
	const { width } = useWindowSize();
	const isMobile = width < 768;

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
						{fosdemImageDetails[event.type as TypeIds].license}.{" "}
						<a
							href={fosdemImageDetails[event.type as TypeIds].original}
							target="_blank"
							rel="noreferrer"
						>
							The original image can be found here
						</a>.
					</span>
					{fosdemImageDetails[event.type as TypeIds].changes && (
						<span className="text-xs block mt-1">
							Changes made to the image are:{" "}
							{fosdemImageDetails[event.type as TypeIds].changes}
						</span>
					)}
				</div>
			</div>
		</>
	);
}
