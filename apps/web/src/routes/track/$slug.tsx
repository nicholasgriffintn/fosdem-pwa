import { createFileRoute } from "@tanstack/react-router";

import { getAllData } from "~/server/functions/fosdem";
import { PageHeader } from "~/components/PageHeader";
import { EventList } from "~/components/Event/EventList";
import type { Conference, Event } from "~/types/fosdem";
import { constants } from "~/constants";
import { useAuth } from "~/hooks/use-auth";
import { useMutateBookmark } from "~/hooks/use-mutate-bookmark";
import { EmptyStateCard } from "~/components/EmptyStateCard";

export const Route = createFileRoute("/track/$slug")({
	component: TrackPage,
	validateSearch: ({ year, day }: { year: number; day: string }) => ({
		year:
			(constants.AVAILABLE_YEARS.includes(year) && year) ||
			constants.DEFAULT_YEAR,
		day: day || undefined,
	}),
	loaderDeps: ({ search: { year, day } }) => ({ year, day }),
	loader: async ({ params, deps: { year, day } }) => {
		const slug = decodeURIComponent(params.slug);
		const data = (await getAllData({ data: { year } })) as Conference;
		const days = Object.values(data.days);
		const track = data.tracks[slug];
		const type = data.types[track?.type];

		const eventData = Object.values(data.events).filter(
			(event: Event): event is Event => event.trackKey === slug,
		);

		return { fosdem: { days, track, type, eventData }, year, day };
	},
	head: ({ loaderData }) => ({
		meta: [
			{
				title: `${loaderData?.fosdem.track?.name} | FOSDEM PWA`,
				description: loaderData?.fosdem.track?.description,
			},
		],
	}),
	staleTime: 10_000,
});

function TrackPage() {
	const { fosdem, year, day } = Route.useLoaderData();

	const { user } = useAuth();
	const { create: createBookmark } = useMutateBookmark({ year });
	const onCreateBookmark = (bookmark: any) => {
		createBookmark(bookmark);
	};

	if (!fosdem.track) {
		return (
			<div className="min-h-screen">
				<div className="relative py-6 lg:py-10">
					<EmptyStateCard
						title="Track not found"
						description="We couldn't find this track. It may have moved or the link might be outdated."
					/>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen">
			<div className="relative py-6 lg:py-10">
				<PageHeader
					heading={fosdem.track.name}
					year={year}
					breadcrumbs={
						fosdem.type
							? [{ title: fosdem.type.name, href: `/type/${fosdem.type.id}` }]
							: []
					}
					metadata={[
						{
							text: `${fosdem.track.room}`,
							href: `/rooms/${fosdem.track.room}`,
						},
						{
							text: `Day ${Array.isArray(fosdem.track.day) ? fosdem.track.day.join(" and ") : fosdem.track.day}`,
						},
						{
							text: `${fosdem.track.eventCount} events`,
						},
					]}
				/>
				{fosdem.eventData?.length > 0 ? (
					<EventList
						events={fosdem.eventData}
						year={year}
						groupByDay={true}
						days={fosdem.days}
						defaultViewMode="list"
						displayViewMode={false}
						day={day}
						user={user}
						onCreateBookmark={onCreateBookmark}
						displaySortByFavourites={true}
					/>
				) : (
					<EmptyStateCard
						title="No sessions in this track"
						description="There are no events scheduled here yet. Try another day or browse a different track."
					/>
				)}
			</div>
		</div>
	);
}
