import { brand } from "@roomisfull/conference";
import { createFileRoute } from "@tanstack/react-router";

import { getAllData } from "~/server/functions/schedule";
import { PageHeader } from "~/components/shared/PageHeader";
import { TrackList } from "~/components/Track/TrackList";
import type { Conference, Track } from "~/types/conference";
import { constants } from "~/constants";
import { typeDescriptions } from "~/conferences/presentation";
import { useAuth } from "~/hooks/use-auth";
import { useMutateBookmark } from "~/hooks/use-mutate-bookmark";
import { EmptyStateCard } from "~/components/shared/EmptyStateCard";
import { getBookmarks } from "~/server/functions/bookmarks";
import { isTrack } from "~/lib/type-guards";
import { generateCommonSEOTags } from "~/utils/seo-generator";
import { PageShell } from "~/components/shared/PageShell";
import { resolveTodayDayId } from "~/lib/dateTime";

export const Route = createFileRoute("/type/$slug")({
	component: TypePage,
	validateSearch: ({
		year,
		day,
		sortFavourites,
	}: {
		year: number;
		day?: string;
		sortFavourites?: string;
	}) => ({
		year:
			(constants.AVAILABLE_YEARS.includes(year) && year) ||
			constants.DEFAULT_YEAR,
		day: day || undefined,
		sortFavourites: sortFavourites || undefined,
	}),
	loaderDeps: ({ search: { year, day, sortFavourites } }) => ({
		year,
		day,
		sortFavourites,
	}),
	loader: async ({ params, deps: { year, day } }) => {
		const data = (await getAllData({ data: { year } })) as Conference;
		const days = Object.values(data.days);
		const type = data.types[params.slug];

		const trackData = Object.values(data.tracks).filter(
			(track): track is Track => isTrack(track) && track.type === params.slug,
		);

		const serverBookmarks = await getBookmarks({
			data: { year, status: "favourited" },
		});

		return { schedule: { days, type, trackData }, year, day, serverBookmarks };
	},
	head: ({ loaderData }) => ({
		meta: [
			...generateCommonSEOTags({
				title: `${loaderData?.schedule.type?.name} | ${brand.name}`,
				description: typeDescriptions[loaderData?.schedule.type?.id || ""],
			}),
		],
	}),
	staleTime: 1000 * 60 * 5, // 5 minutes
});

function TypePage() {
	const { schedule, year, day, serverBookmarks } = Route.useLoaderData();
	const { sortFavourites } = Route.useSearch();
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

	if (!schedule.type) {
		return (
			<PageShell>
				<PageHeader heading="Type not found" />
				<EmptyStateCard
					title="Whoops!"
					description="We couldn't find this type of content. Please check the link and try again."
				/>
			</PageShell>
		);
	}

	return (
		<PageShell>
			<PageHeader
				heading={schedule.type.name}
				year={year}
				text={typeDescriptions[schedule.type.id]}
				metadata={[
					{
						text: `${schedule.type.trackCount} tracks`,
					},
				]}
			/>
			{schedule.trackData?.length > 0 ? (
				<TrackList
					tracks={schedule.trackData}
					year={year}
					groupByDay={true}
					days={schedule.days}
					day={resolvedDay}
					sortFavourites={sortFavourites}
					onSortFavouritesChange={handleSortFavouritesChange}
					user={user}
					onCreateBookmark={onCreateBookmark}
					displaySortByFavourites={true}
					serverBookmarks={serverBookmarks}
				/>
			) : (
				<EmptyStateCard
					title="No tracks for this type"
					description="We don’t have tracks for this content type yet. Check another type or return later."
				/>
			)}
		</PageShell>
	);
}
