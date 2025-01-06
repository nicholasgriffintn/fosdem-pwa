import { createFileRoute } from "@tanstack/react-router";

import { getAllData } from "~/functions/getFosdemData";
import { PageHeader } from "~/components/PageHeader";
import { EventList } from "~/components/Event/EventList";
import type { Conference, Event } from "~/types/fosdem";
import { constants } from "~/constants";

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
		const data = (await getAllData({ data: { year } })) as Conference;
		const days = Object.values(data.days);
		const track = data.tracks[params.slug];
		const type = data.types[track?.type];

		const eventData = Object.values(data.events).filter(
			(event: Event): event is Event => event.trackKey === params.slug,
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

	if (!fosdem.track || !fosdem.type) {
		return (
			<div className="min-h-screen">
				<div className="relative py-6 lg:py-10">
					<PageHeader
						heading="Track not found"
						breadcrumbs={[
							{ title: fosdem.type.name, href: `/type/${fosdem.type.id}` },
						]}
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
					breadcrumbs={[
						{ title: fosdem.type.name, href: `/type/${fosdem.type.id}` },
					]}
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
				<EventList
					events={fosdem.eventData}
					year={year}
					groupByDay={true}
					days={fosdem.days}
					defaultViewMode="list"
					displayViewMode={false}
					day={day}
				/>
			</div>
		</div>
	);
}
