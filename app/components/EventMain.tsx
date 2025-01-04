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
import type { Event, ConferenceData, FosdemImageType } from "~/types/fosdem";
import { fosdemImageDetails } from "~/data/fosdem-image-details";

export function EventMain({
	event,
	conference,
	year,
}: { event: Event; conference: ConferenceData; year: number }) {
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
				{event.abstract && (
					<div className="prose prose-lg prose-indigo overflow-scroll mt-4">
						<h2 className="text-xl font-medium">Description</h2>
						{/* biome-ignore lint/security/noDangerouslySetInnerHtml: We want to render the abstract as HTML */}
						<div
							className="mt-2"
							dangerouslySetInnerHTML={{ __html: event.abstract }}
						/>
					</div>
				)}
				{event.links?.length > 0 && (
					<div className="mt-2">
						<h2 className="text-xl font-medium">Links</h2>
						<ul className="mt-2 space-y-2 list-disc list-inside">
							{event.links.map((link) => {
								return (
									<li key={link.href}>
										<a href={link.href} target="_blank" rel="noreferrer">
											{link.title}
										</a>
									</li>
								);
							})}
						</ul>
					</div>
				)}
				<div className="mt-4">
					{(event.abstract || event.links?.length > 0) && (
						<hr className="my-4" />
					)}
					<span className="text-sm block mb-2">
						Notice: The placeholder video image is licensed under{" "}
						{fosdemImageDetails[event.type as FosdemImageType].license} and is
						, {" "}
						<a
							href={fosdemImageDetails[event.type as FosdemImageType].original}
							target="_blank"
							rel="noreferrer"
						>
							the original image can be found here
						</a>.
					</span>
					{fosdemImageDetails[event.type as FosdemImageType].changes && (
						<span className="text-xs block mt-1">
							Changes made to the image are:{" "}
							{fosdemImageDetails[event.type as FosdemImageType].changes}
						</span>
					)}
				</div>
			</div>
		</>
	);
}
