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
			<h2 className="text-xl font-medium mb-4 text-foreground">
				Notes
			</h2>
			<noscript>
				<div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
					Notes are only available with JavaScript enabled. You can still browse the
					event details and schedule.
				</div>
			</noscript>
			<div className="js-required flex-1 flex flex-col min-h-0">
				{loading ? (
					<Skeleton
						className={clsx("h-full", {
							"min-h-[40px] max-h-[40px]": isMobile,
						})}
					/>
				) : (
					<div className="flex-1 flex flex-col min-h-0">
							{isMobile ? <EventNotesMobile event={event} year={year} /> : <EventNotes event={event} year={year} />}
					</div>
				)}
			</div>
		</div>
	);
}
