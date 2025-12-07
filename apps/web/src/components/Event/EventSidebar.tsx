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
	videoRef: React.RefObject<HTMLVideoElement | null>;
};

export function EventSidebar({
	event,
	isMobile = false,
	year,
	videoRef,
}: EventSidebarProps) {
	const { loading } = useAuth();

	const sidebarClassName = clsx("h-full", {
		"p-6": !isMobile,
		"pt-6 pb-6": isMobile,
	});

	return (
		<div className={sidebarClassName}>
			{loading ? (
				<Skeleton
					className={clsx("h-full", {
						"min-h-[40px] max-h-[40px]": isMobile,
					})}
				/>
			) : (
				<div>
					{isMobile ? (
						<EventNotesMobile
							event={event}
							year={year}
							videoRef={videoRef}
						/>
					) : (
						<>
									<h2 className="text-xl font-medium mb-4 text-foreground">Notes</h2>
							<EventNotes
								event={event}
								year={year}
								videoRef={videoRef}
							/>
						</>
					)}
				</div>
			)}
		</div>
	);
}
