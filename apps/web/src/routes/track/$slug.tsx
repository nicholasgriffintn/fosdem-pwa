import { conferenceConfig } from "@roomisfull/conference";
import { createFileRoute } from "@tanstack/react-router";

import { getAllData } from "~/server/functions/schedule";
import { PageHeader } from "~/components/shared/PageHeader";
import { EventList } from "~/components/Event/EventList";
import type { Event, Conference } from "~/types/conference";
import { constants } from "~/constants";
import { useAuth } from "~/hooks/use-auth";
import { useMutateBookmark } from "~/hooks/use-mutate-bookmark";
import { EmptyStateCard } from "~/components/shared/EmptyStateCard";
import { getBookmarks } from "~/server/functions/bookmarks";
import { isEvent } from "~/lib/type-guards";
import { generateCommonSEOTags } from "~/utils/seo-generator";
import { PageShell } from "~/components/shared/PageShell";
import { resolveTodayDayId } from "~/lib/dateTime";

export const Route = createFileRoute("/track/$slug")({
	component: TrackPage,
	validateSearch: ({
		year,
		day,
		view,
		sortFavourites,
	}: {
		year: number;
		day?: string;
		view?: string;
		sortFavourites?: string;
	}) => ({
		year:
			(constants.AVAILABLE_YEARS.includes(year) && year) ||
			constants.DEFAULT_YEAR,
		day: day || undefined,
		view: view || undefined,
		sortFavourites: sortFavourites || undefined,
	}),
	loaderDeps: ({ search: { year, day, view, sortFavourites } }) => ({
		year,
		day,
		view,
		sortFavourites,
	}),
	loader: async ({ params, deps: { year, day } }) => {
		const slug = decodeURIComponent(params.slug);
		const data = (await getAllData({ data: { year } })) as Conference;
		const days = Object.values(data.days);
		const track = data.tracks[slug];
		const type = data.types[track?.type];

		const eventData = Object.values(data.events).filter(
			(event): event is Event => isEvent(event) && event.trackKey === slug,
		);

		const serverBookmarks = await getBookmarks({
			data: { year, status: "favourited" },
		});

		return {
			schedule: { days, track, type, eventData },
			year,
			day,
			serverBookmarks,
		};
	},
	head: ({ loaderData }) => ({
		meta: [
			...generateCommonSEOTags({
				title: `${loaderData?.schedule.track?.name} | Track | ${conferenceConfig.name} ${loaderData?.year}`,
				description:
					loaderData?.schedule.track?.description ||
					`${loaderData?.schedule.track?.name} track at ${conferenceConfig.name} ${loaderData?.year}. ${loaderData?.schedule.track?.eventCount} events.`,
			}),
		],
	}),
	staleTime: 1000 * 60 * 5, // 5 minutes
});

function TrackPage() {
	const { schedule, year, day, serverBookmarks } = Route.useLoaderData();
	const { view, sortFavourites } = Route.useSearch();
	const navigate = Route.useNavigate();
	const resolvedDay = day ?? resolveTodayDayId(schedule.days);

	const { user } = useAuth();
	const { create: createBookmark } = useMutateBookmark({ year });
	const onCreateBookmark = async (bookmark: any) => {
		await createBookmark(bookmark);
	};
	const handleSortFavouritesChange = (checked: boolean) => {
		navigate({
			search: (prev) => ({
				...prev,
				sortFavourites: checked ? "true" : undefined,
			}),
		});
	};

	if (!schedule.track) {
		return (
			<PageShell>
				<PageHeader heading="Track not found" year={year} />
				<EmptyStateCard
					title="Whoops!"
					description="We couldn't find this track. It may have moved or the link might be outdated."
				/>
			</PageShell>
		);
	}

	return (
		<PageShell>
			<PageHeader
				heading={schedule.track.name}
				year={year}
				breadcrumbs={
					schedule.type
						? [{ title: schedule.type.name, href: `/type/${schedule.type.id}` }]
						: []
				}
				metadata={[
					{
						text: `${schedule.track.room}`,
						href: `/rooms/${schedule.track.room}`,
					},
					{
						text: `Day ${Array.isArray(schedule.track.day) ? schedule.track.day.join(" and ") : schedule.track.day}`,
					},
					{
						text: `${schedule.track.eventCount} events`,
					},
				]}
			/>
			{schedule.eventData?.length > 0 ? (
				<EventList
					events={schedule.eventData}
					year={year}
					groupByDay={true}
					days={schedule.days}
					defaultViewMode="list"
					displayViewMode={false}
					day={resolvedDay}
					view={view}
					sortFavourites={sortFavourites}
					onSortFavouritesChange={handleSortFavouritesChange}
					user={user}
					onCreateBookmark={onCreateBookmark}
					displaySortByFavourites={true}
					serverBookmarks={serverBookmarks}
				/>
			) : (
				<EmptyStateCard
					title="No sessions in this track"
					description="There are no events scheduled here yet. Try another day or browse a different track."
				/>
			)}
		</PageShell>
	);
}
