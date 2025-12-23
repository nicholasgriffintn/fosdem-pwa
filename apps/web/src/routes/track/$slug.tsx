import { createFileRoute } from "@tanstack/react-router";

import { getAllData } from "~/server/functions/fosdem";
import { PageHeader } from "~/components/shared/PageHeader";
import { EventList } from "~/components/Event/EventList";
import type { Event, Conference } from "~/types/fosdem";
import { constants } from "~/constants";
import { useAuth } from "~/hooks/use-auth";
import { useMutateBookmark } from "~/hooks/use-mutate-bookmark";
import { EmptyStateCard } from "~/components/shared/EmptyStateCard";
import { getBookmarks } from "~/server/functions/bookmarks";
import { isEvent } from "~/lib/type-guards";
import { generateCommonSEOTags } from "~/utils/seo-generator";
import { PageShell } from "~/components/shared/PageShell";

export const Route = createFileRoute("/track/$slug")({
	component: TrackPage,
	validateSearch: ({ year, day, view, sortFavourites }: { year: number; day?: string; view?: string; sortFavourites?: string }) => ({
		year:
			(constants.AVAILABLE_YEARS.includes(year) && year) ||
			constants.DEFAULT_YEAR,
		day: day || undefined,
		view: view || undefined,
		sortFavourites: sortFavourites || undefined,
	}),
	loaderDeps: ({ search: { year, day, view, sortFavourites } }) => ({ year, day, view, sortFavourites }),
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

		return { fosdem: { days, track, type, eventData }, year, day, serverBookmarks };
	},
	head: ({ loaderData }) => ({
		meta: [
			...generateCommonSEOTags({
				title: `${loaderData?.fosdem.track?.name} | Track | FOSDEM ${loaderData?.year}`,
				description: loaderData?.fosdem.track?.description || `${loaderData?.fosdem.track?.name} track at FOSDEM ${loaderData?.year}. ${loaderData?.fosdem.track?.eventCount} events.`,
			})
		],
	}),
	staleTime: 10_000,
});

function TrackPage() {
	const { fosdem, year, day, serverBookmarks } = Route.useLoaderData();
	const { view, sortFavourites } = Route.useSearch();
	const navigate = Route.useNavigate();

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

	if (!fosdem.track) {
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
