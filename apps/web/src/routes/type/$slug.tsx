import { createFileRoute } from "@tanstack/react-router";

import { getAllData } from "~/server/functions/fosdem";
import { PageHeader } from "~/components/PageHeader";
import { TrackList } from "~/components/Track/TrackList";
import type { Conference, Track } from "~/types/fosdem";
import { constants } from "~/constants";
import { fosdemTypeDescriptions } from "~/data/fosdem-type-descriptions";
import { useAuth } from "~/hooks/use-auth";
import { useMutateBookmark } from "~/hooks/use-mutate-bookmark";
import { EmptyStateCard } from "~/components/EmptyStateCard";
import { getBookmarks } from "~/server/functions/bookmarks";
import { isTrack } from "~/lib/type-guards";

export const Route = createFileRoute("/type/$slug")({
	component: TypePage,
	validateSearch: ({ year, day, sortFavourites }: { year: number; day?: string; sortFavourites?: string }) => ({
		year:
			(constants.AVAILABLE_YEARS.includes(year) && year) ||
			constants.DEFAULT_YEAR,
		day: day || undefined,
		sortFavourites: sortFavourites || undefined,
	}),
	loaderDeps: ({ search: { year, day, sortFavourites } }) => ({ year, day, sortFavourites }),
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

		return { fosdem: { days, type, trackData }, year, day, serverBookmarks };
	},
	head: ({ loaderData }) => ({
		meta: [
			{
				title: `${loaderData?.fosdem.type?.name} | FOSDEM PWA`,
				description:
					fosdemTypeDescriptions[
						loaderData?.fosdem.type?.id as keyof typeof fosdemTypeDescriptions
					],
			},
		],
	}),
	staleTime: 10_000,
});

function TypePage() {
	const { fosdem, year, day, serverBookmarks } = Route.useLoaderData();
	const { sortFavourites } = Route.useSearch();
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

	if (!fosdem.type) {
		return (
			<div className="min-h-screen">
				<div className="relative py-6 lg:py-10">
					<EmptyStateCard
						title="Type not found"
						description="We couldn't find this type of content. Please check the link and try again."
					/>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen">
			<div className="relative py-6 lg:py-10">
				<PageHeader
					heading={fosdem.type.name}
					year={year}
					text={
						fosdemTypeDescriptions[
							fosdem.type.id as keyof typeof fosdemTypeDescriptions
						]
					}
					metadata={[
						{
							text: `${fosdem.type.trackCount} tracks`,
						},
					]}
				/>
				{fosdem.trackData?.length > 0 ? (
					<TrackList
						tracks={fosdem.trackData}
						year={year}
						groupByDay={true}
						days={fosdem.days}
						day={day}
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
			</div>
		</div>
	);
}
