"use client";

import { useRef } from "react";

import { EventSidebar } from "~/components/EventSidebar";
import { EventPlayer } from "~/components/EventPlayer";
import { ChatAlert } from "~/components/ChatAlert";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "~/components/ui/resizable";
import { useWindowSize } from "~/hooks/use-window-size";
import type { Event, ConferenceData } from "~/types/fosdem";

export function EventMain({
	event,
	conference,
	year,
}: { event: Event; conference: ConferenceData; year: number }) {
	const videoRef = useRef<HTMLVideoElement>(null);

	const { width } = useWindowSize();

	return (
		<>
			{width < 768 && (
				<div className="space-y-4">
					<div className="overflow-hidden rounded-lg border bg-card">
						<div className="w-full">
							<EventPlayer
								event={event}
								isMobile
								conference={conference}
								videoRef={videoRef}
							/>
						</div>
						{event.chat && <ChatAlert chatUrl={event.chat} />}
					</div>
					<EventSidebar
						event={event}
						isMobile
						year={year}
						videoRef={videoRef}
					/>
				</div>
			)}
			{width >= 768 && (
				<ResizablePanelGroup
					direction="horizontal"
					className="min-h-[200px] rounded-lg border"
				>
					<ResizablePanel defaultSize={75}>
						<div className="h-full flex flex-col">
							<div className="flex-1">
								<EventPlayer
									event={event}
									conference={conference}
									videoRef={videoRef}
								/>
							</div>
							{event.chat && <ChatAlert chatUrl={event.chat} />}
						</div>
					</ResizablePanel>
					<ResizableHandle withHandle />
					<ResizablePanel defaultSize={25}>
						<EventSidebar
							event={event}
							year={year}
							videoRef={videoRef}
						/>
					</ResizablePanel>
				</ResizablePanelGroup>
			)}
			<div className="w-full">
				{event.abstract && (
					<div className="prose prose-lg prose-indigo overflow-scroll mt-4">
						<h2 className="text-xl font-medium">Description</h2>
						{/* biome-ignore lint/security/noDangerouslySetInnerHtml: We want to render the abstract as HTML */}
						<div className="mt-2" dangerouslySetInnerHTML={{ __html: event.abstract }} />
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
			</div>
		</>
	);
}
