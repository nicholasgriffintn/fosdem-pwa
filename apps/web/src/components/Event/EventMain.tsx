"use client";

import { EventSidebar } from "~/components/Event/EventSidebar";
import { EventPlayer } from "~/components/Event/EventPlayer";
import { ChatAlert } from "~/components/Event/ChatAlert";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "~/components/ui/resizable";
import { useWindowSize } from "~/hooks/use-window-size";
import type { Event, ConferenceData, TypeIds, Person } from "~/types/fosdem";
import { fosdemImageDetails } from "~/data/fosdem-image-details";
import { fosdemSpecialRooms } from "~/data/fosdem-special-rooms";
import { EventContent } from "~/components/Event/EventContent";

type EventMainProps = {
	event: Event;
	conference: ConferenceData;
	year: number;
	isTest?: boolean;
	referenceTime?: Date;
	persons?: Record<string, Person>;
};

const eventLayoutPanelIds = ["event-player-panel", "event-notes-panel"];

export function EventMain({
	event,
	conference,
	year,
	isTest,
	referenceTime,
	persons,
}: EventMainProps) {
	const roomType = event.room?.[0];
	const specialRoom =
		roomType && fosdemSpecialRooms[roomType as keyof typeof fosdemSpecialRooms];
	const testTime = isTest ? new Date(conference.start) : referenceTime;
	const imageDetails = fosdemImageDetails[event.type as TypeIds];

	const { width } = useWindowSize();
	const isMobile = width > 0 ? width < 768 : false;

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
				<EventContent year={year} event={event} persons={persons} />
			</div>
		);
	}

	const player = (
		<div className="h-full flex flex-col">
			<div className="flex-1">
				<EventPlayer
					event={event}
					conference={conference}
					referenceTime={testTime}
					year={year}
				/>
			</div>
			{event.chat && (
				<div id="chat" className="scroll-mt-32">
					<ChatAlert chatUrl={event.chat} />
				</div>
			)}
		</div>
	);
	const sidebar = (
		<EventSidebar event={event} year={year} isMobile={isMobile} />
	);

	return (
		<>
			{isMobile ? (
				<div className="rounded-lg">
					{player}
					<div className="mt-4">{sidebar}</div>
				</div>
			) : (
				<ResizablePanelGroup
					autoSaveId="event-layout-desktop"
					panelIds={eventLayoutPanelIds}
					orientation="horizontal"
					className="min-h-[200px] rounded-lg border"
				>
					<ResizablePanel
						id="event-player-panel"
						minSize="50%"
						defaultSize="75%"
					>
						{player}
					</ResizablePanel>
					<ResizableHandle withHandle />
					<ResizablePanel
						id="event-notes-panel"
						minSize="20%"
						defaultSize="25%"
					>
						{sidebar}
					</ResizablePanel>
				</ResizablePanelGroup>
			)}
			<div className="w-full">
				<EventContent year={year} event={event} persons={persons} />
				<div className="mt-4">
					{(event.abstract || event.links?.length > 0) && (
						<hr className="my-4" />
					)}
					<span className="text-sm block mb-2">
						Notice: The placeholder video image is licensed under{" "}
						{imageDetails?.license ?? "the stated license by the content owner"}
						.{" "}
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
