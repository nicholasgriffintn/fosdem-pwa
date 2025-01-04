import clsx from "clsx";
import { Link } from "@tanstack/react-router";

import type { Event } from "~/types/fosdem";
import { useAuth } from "~/hooks/use-auth";
import { Skeleton } from "./ui/skeleton";
import { Button } from "./ui/button";
import { EventNotes } from "./EventNotes";

export function EventSidebar({
	event,
	isMobile = false,
	year,
	videoRef,
}: {
	event: Event;
	isMobile?: boolean;
	year: number;
	videoRef: React.RefObject<HTMLVideoElement | null>;
}) {
	const { user, loading } = useAuth();

	const sidebarClassName = clsx("h-full", {
		"p-6": !isMobile,
		"pt-6 pb-6": isMobile,
	});

	return (
		<div className={sidebarClassName}>
			{loading ? (
				<Skeleton className="h-full" />
			) : (
				<div>
					{user ? (
						<EventNotes
							event={event}
							year={year}
							userId={user.github_username}
							videoRef={videoRef}
						/>
					) : (
						<>
							<p>Sign in to make notes from this session.</p>
							<Link to="/signin">
								<Button>Sign in</Button>
							</Link>
						</>
					)}
				</div>
			)}
		</div>
	);
}
