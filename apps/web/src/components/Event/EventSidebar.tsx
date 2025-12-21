import clsx from "clsx";

import type { Event } from "~/types/fosdem";
import { useAuth } from "~/hooks/use-auth";
import { Skeleton } from "~/components/ui/skeleton";
import { EventNotes } from "~/components/Event/EventNotes";
import { EventNotesMobile } from "~/components/Event/EventNotesMobile";

type EventSidebarProps = {
	event: Event;
	isMobile?: boolean;
	year: number;
};

export function EventSidebar({
	event,
	isMobile = false,
	year,
}: EventSidebarProps) {
	const { loading } = useAuth();

	const sidebarClassName = clsx("h-full flex flex-col min-h-0", {
		"p-6": !isMobile,
		"pt-6 pb-6": isMobile,
	});

	return (
		<div className={sidebarClassName}>
			<noscript>
				<div className="border border-amber-500 bg-amber-50 dark:bg-amber-950 p-4 rounded-lg">
					<h3 className="font-semibold text-sm mb-2">Notes Require JavaScript</h3>
					<p className="text-xs text-muted-foreground mb-2">
						To take notes during this event, please enable JavaScript in your browser.
					</p>
					<p className="text-xs text-muted-foreground">
						You can still view event details and the schedule without JavaScript.
					</p>
				</div>
			</noscript>
			{loading ? (
				<Skeleton
					className={clsx("h-full", {
						"min-h-[40px] max-h-[40px]": isMobile,
					})}
				/>
			) : (
				<div className="flex-1 flex flex-col min-h-0">
					{isMobile ? (
						<EventNotesMobile event={event} year={year} />
					) : (
						<>
							<h2 className="text-xl font-medium mb-4 text-foreground">
								Notes
							</h2>
							<EventNotes event={event} year={year} />
						</>
					)}
				</div>
			)}
		</div>
	);
}
