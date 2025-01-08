import { createFileRoute } from "@tanstack/react-router";

import { getAllData } from "~/server/functions/fosdem";
import { PageHeader } from "~/components/PageHeader";
import { TrackList } from "~/components/Track/TrackList";
import type { Conference, Track } from "~/types/fosdem";
import { constants } from "~/constants";
import { fosdemTypeDescriptions } from "~/data/fosdem-type-descriptions";
import { useAuth } from "~/hooks/use-auth";
import { useMutateBookmark } from "~/hooks/use-mutate-bookmark";

export const Route = createFileRoute("/type/$slug")({
	component: TypePage,
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
		const type = data.types[params.slug];

		const trackData = Object.values(data.tracks).filter(
			(track: Track): track is Track => track.type === params.slug,
		);

		return { fosdem: { days, type, trackData }, year, day };
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
	const { fosdem, year, day } = Route.useLoaderData();

	const { user } = useAuth();
	const { create: createBookmark } = useMutateBookmark({ year });
	const onCreateBookmark = (bookmark: any) => {
		createBookmark(bookmark);
	};

	if (!fosdem.type) {
		return (
			<div className="min-h-screen">
				<div className="relative py-6 lg:py-10">
					<PageHeader heading="Type not found" />
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen">
			<div className="relative py-6 lg:py-10">
				<PageHeader
					heading={fosdem.type.name}
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
				<TrackList
					tracks={fosdem.trackData}
					year={year}
					groupByDay={true}
					days={fosdem.days}
					day={day}
					user={user}
					onCreateBookmark={onCreateBookmark}
				/>
			</div>
		</div>
	);
}
