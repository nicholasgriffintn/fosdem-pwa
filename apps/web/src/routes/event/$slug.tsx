import { getEventMetadataJson } from "~/utils/event-metadata";
import { conferenceConfig } from "@roomisfull/conference";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { PageHeader } from "~/components/shared/PageHeader";
import { FavouriteButton } from "~/components/shared/FavouriteButton";
import { ShareButton } from "~/components/shared/ShareButton";
import { WatchLaterButton } from "~/components/WatchLater/WatchLaterButton";
import { AttendanceButton } from "~/components/Event/AttendanceButton";
import { useWatchLater } from "~/hooks/use-watch-later";
import { useAttendance } from "~/hooks/use-attendance";
import { testLiveEvent, testConferenceData } from "~/data/test-data";
import { getAllData } from "~/server/functions/schedule";
import { EventMain } from "~/components/Event/EventMain";
import { constants } from "~/constants";
import { calculateEndTime, isEventFinished, isEventLive } from "~/lib/dateTime";
import { useBookmark } from "~/hooks/use-bookmark";
import { useMutateBookmark } from "~/hooks/use-mutate-bookmark";
import { EmptyStateCard } from "~/components/shared/EmptyStateCard";
import { useIsClient } from "~/hooks/use-is-client";
import { getEventBookmark } from "~/server/functions/bookmarks";
import { generateCommonSEOTags } from "~/utils/seo-generator";
import { PageShell } from "~/components/shared/PageShell";

type BookmarkLike = {
	status?: string;
} | null;

export function resolveFavouriteStatus({
	bookmark,
	bookmarkLoading,
}: {
	bookmark: BookmarkLike;
	bookmarkLoading: boolean;
}) {
	const hasResolvedStatus = Boolean(bookmark?.status);

	if (bookmarkLoading && !hasResolvedStatus) {
		return "loading";
	}

	return bookmark?.status ?? "unfavourited";
}

export const Route = createFileRoute("/event/$slug")({
	component: EventPage,
	validateSearch: ({ test, year }: { test: boolean; year: string }) => ({
		test: test === true,
		year:
			(constants.AVAILABLE_YEARS.includes(Number(year)) && Number(year)) ||
			constants.DEFAULT_YEAR,
	}),
	loaderDeps: ({ search: { test, year } }) => ({ test, year }),
	loader: async ({ params, deps: { test, year } }) => {
		if (test) {
			return {
				schedule: {
					event: testLiveEvent,
					conference: testConferenceData,
					track: {
						id: "radio",
						name: "Radio",
					},
					type: {
						id: "devroom",
						name: "Developer Room",
					},
				},
				year,
				isTest: true,
				serverBookmark: null,
			};
		}

		const schedule = await getAllData({ data: { year } });

		let serverBookmark = null;
		try {
			serverBookmark = await getEventBookmark({
				data: { year, slug: params.slug },
			});
		} catch (error) {
			console.warn("Failed to load bookmark:", error);
		}

		return {
			schedule: {
				event: schedule.events[params.slug],
				conference: schedule.conference,
				track: schedule.tracks[schedule.events[params.slug]?.trackKey],
				type: schedule.types[
					schedule.tracks[schedule.events[params.slug]?.trackKey]?.type
				],
				persons: schedule.persons,
			},
			year,
			isTest: false,
			serverBookmark,
		};
	},
	head: ({ loaderData }) => ({
		meta: [
			...generateCommonSEOTags({
				title:
					loaderData?.schedule.event?.title ||
					`Event at ${conferenceConfig.name}`,
				description:
					loaderData?.schedule.event?.description ||
					loaderData?.schedule.event?.abstract ||
					`Event at ${conferenceConfig.name} ${loaderData?.year} in ${loaderData?.schedule.event?.room}`,
			}),
			{
				property: "og:type",
				content: "article",
			},
			{
				name: "twitter:card",
				content: "summary_large_image",
			},
		],
		scripts: loaderData?.schedule.event
			? [
					{
						type: "application/ld+json",
						children: getEventMetadataJson(
							loaderData.schedule.event,
							loaderData.schedule.conference,
							loaderData.year,
						),
					},
				]
			: [],
	}),
	staleTime: 1000 * 60 * 5, // 5 minutes
});

function EventPage() {
	const { schedule, year, isTest, serverBookmark } = Route.useLoaderData();
	const isClient = useIsClient();
	const headerSentinelRef = useRef<HTMLDivElement | null>(null);
	const [showStickyTitle, setShowStickyTitle] = useState(false);
	const [referenceTime, setReferenceTime] = useState<Date | undefined>(
		undefined,
	);

	const { bookmark, loading: bookmarkLoading } = useBookmark({
		year,
		slug: schedule?.event?.id,
	});
	const { create: createBookmark } = useMutateBookmark({ year });
	const { toggle: toggleWatchLater } = useWatchLater({ year });
	const { markAttended, unmarkAttended } = useAttendance({ year });
	const onCreateBookmark = async (bookmark: any) => {
		await createBookmark(bookmark);
	};

	const currentBookmark = isClient ? bookmark : serverBookmark;
	const isBookmarked = currentBookmark?.status === "favourited";
	const isInWatchLater = currentBookmark?.watch_later === true;
	const isAttended = currentBookmark?.attended === true;
	const isAttendedInPerson = currentBookmark?.attended_in_person === true;
	const currentBookmarkId = currentBookmark?.id;
	const eventFinished =
		schedule.event && schedule.conference && referenceTime
			? isEventFinished(schedule.event, schedule.conference, referenceTime)
			: false;
	const eventLive =
		schedule.event && schedule.conference && referenceTime
			? isEventLive(schedule.event, schedule.conference, referenceTime)
			: false;
	const canMarkAttendance = eventFinished || eventLive;
	const favouriteStatus = isClient
		? resolveFavouriteStatus({
				bookmark,
				bookmarkLoading,
			})
		: (serverBookmark?.status ?? "unfavourited");

	useEffect(() => {
		if (!isClient) {
			return;
		}
		setReferenceTime(new Date());
		const el = headerSentinelRef.current;
		if (!el) {
			return;
		}

		const observer = new IntersectionObserver(
			([entry]) => {
				setShowStickyTitle(!entry.isIntersecting);
			},
			{ threshold: 0 },
		);

		observer.observe(el);
		return () => observer.disconnect();
	}, [isClient]);

	if (!schedule.event?.title || !schedule.conference) {
		return (
			<PageShell maxWidth="none">
				<PageHeader heading="Event not found" />
				<EmptyStateCard
					title="Whoops!"
					description="We couldn't find this event. It may have been removed or the link is incorrect."
				/>
			</PageShell>
		);
	}

	return (
		<PageShell maxWidth="none">
			<PageHeader
				heading={schedule.event.title}
				year={year}
				breadcrumbs={[
					{ title: schedule.type?.name, href: `/type/${schedule.type?.id}` },
					{
						title: schedule.track?.name,
						href: schedule.track?.id
							? `/track/${encodeURIComponent(schedule.track.id)}`
							: "#",
					},
				]}
				subtitle={schedule.event.subtitle}
				metadata={[
					{
						text: `${schedule.event.room}`,
						href: `/rooms/${schedule.event.room}`,
					},
					{
						text: `Day ${schedule.event.day}`,
					},
					{
						text: `${schedule.event.startTime} - ${calculateEndTime(
							schedule.event.startTime,
							schedule.event.duration,
						)}`,
					},
					{
						text: `Speakers: ${schedule.event.persons?.join(", ")}`,
					},
				]}
				additionalHeadingPaddingClass="h-0 md:h-6"
			>
				<div className="hidden md:flex items-center md:pl-6 md:pr-3 gap-2">
					<FavouriteButton
						year={year}
						type="event"
						slug={schedule?.event?.id}
						status={favouriteStatus}
						onCreateBookmark={onCreateBookmark}
					/>
					{eventFinished && (
						<WatchLaterButton
							bookmarkId={currentBookmarkId ?? ""}
							isInWatchLater={isInWatchLater}
							onToggle={toggleWatchLater}
							variant="icon"
							disabled={!isBookmarked || !currentBookmarkId}
						/>
					)}
					{canMarkAttendance && (
						<AttendanceButton
							bookmarkId={currentBookmarkId ?? ""}
							isAttended={isAttended}
							isInPerson={isAttendedInPerson}
							onMarkAttended={markAttended}
							onUnmarkAttended={unmarkAttended}
							disabled={!isBookmarked || !currentBookmarkId}
						/>
					)}
					<ShareButton
						title={schedule?.event?.title}
						text={`Check out ${schedule?.event?.title} at ${conferenceConfig.name}`}
						url={`${conferenceConfig.appUrl}/event/${schedule?.event?.id}?year=${year}`}
					/>
				</div>
			</PageHeader>
			<div ref={headerSentinelRef} />
			<div className="sticky top-14 z-12 -mx-4 px-4 py-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b md:hidden">
				<div
					className={`flex items-center transition-all duration-300 ease-out ${showStickyTitle ? "gap-3" : "gap-0"}`}
				>
					<div
						className={`min-w-0 overflow-hidden transition-all duration-300 ease-out ${
							showStickyTitle ? "flex-1 opacity-100" : "w-0 flex-none opacity-0"
						}`}
					>
						<span className="block text-sm font-medium text-foreground truncate">
							{schedule.event.title}
						</span>
					</div>
					<div
						className={`flex items-center transition-all duration-300 ease-out ${
							showStickyTitle ? "gap-2 shrink-0" : "gap-2 flex-1"
						}`}
					>
						<FavouriteButton
							year={year}
							type="event"
							slug={schedule?.event?.id}
							status={favouriteStatus}
							onCreateBookmark={onCreateBookmark}
							className={showStickyTitle ? undefined : "flex-1 w-full"}
						/>
						{eventFinished && (
							<WatchLaterButton
								bookmarkId={currentBookmarkId ?? ""}
								isInWatchLater={isInWatchLater}
								onToggle={toggleWatchLater}
								variant="icon"
								disabled={!isBookmarked || !currentBookmarkId}
								className={showStickyTitle ? undefined : "flex-1 w-full"}
							/>
						)}
						{canMarkAttendance && (
							<AttendanceButton
								bookmarkId={currentBookmarkId ?? ""}
								isAttended={isAttended}
								isInPerson={isAttendedInPerson}
								onMarkAttended={markAttended}
								onUnmarkAttended={unmarkAttended}
								disabled={!isBookmarked || !currentBookmarkId}
								className={showStickyTitle ? undefined : "flex-1 w-full"}
							/>
						)}
						<ShareButton
							title={schedule?.event?.title}
							text={`Check out ${schedule?.event?.title} at ${conferenceConfig.name}`}
							url={`${conferenceConfig.appUrl}/event/${schedule?.event?.id}?year=${year}`}
							className={showStickyTitle ? undefined : "flex-1 w-full"}
						/>
					</div>
				</div>
			</div>
			<div className="w-full mt-4 md:mt-0">
				<EventMain
					event={schedule.event}
					conference={schedule.conference}
					year={year}
					isTest={isTest}
					referenceTime={referenceTime}
					persons={schedule.persons}
				/>
			</div>
		</PageShell>
	);
}
