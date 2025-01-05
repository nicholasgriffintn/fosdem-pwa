import clsx from "clsx";
import { Link } from "@tanstack/react-router";

import type { Event } from "~/types/fosdem";
import { useAuth } from "~/hooks/use-auth";
import { Skeleton } from "~/components/ui/skeleton";
import { Button } from "~/components/ui/button";
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
	const { user, loading } = useAuth();

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
					{user ? (
						<>
							{isMobile ? (
								<EventNotesMobile
									event={event}
									year={year}
									userId={user.github_username}
									videoRef={videoRef}
								/>
							) : (
								<>
									<h2 className="text-xl font-medium mb-4">Notes</h2>
									<EventNotes
										event={event}
										year={year}
										userId={user.github_username}
										videoRef={videoRef}
									/>
								</>
							)}
						</>
					) : (
						<div className="flex flex-col">
							<p>Sign in to make notes from this session.</p>
							<Link to="/signin" className="mt-4">
								<Button>Sign in</Button>
							</Link>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
