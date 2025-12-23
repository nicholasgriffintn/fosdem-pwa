import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "~/components/shared/PageHeader";
import { EventList } from "~/components/Event/EventList";
import { getAllData } from "~/server/functions/fosdem";
import { testLiveEvents, testConferenceData } from "~/data/test-data";
import type { Conference } from "~/types/fosdem";
import { constants } from "~/constants";
import { isEventLive, isEventUpcoming } from "~/lib/dateTime";
import { sortEvents, sortUpcomingEvents } from "~/lib/sorting";
import { useAuth } from "~/hooks/use-auth";
import { useMutateBookmark } from "~/hooks/use-mutate-bookmark";
import { getBookmarks } from "~/server/functions/bookmarks";
import { isEvent } from "~/lib/type-guards";
import { generateCommonSEOTags } from "~/utils/seo-generator";

export const Route = createFileRoute("/live/")({
	component: LivePage,
	validateSearch: ({ test, year }: { test: boolean; year: string }) => ({
		test: test === true,
		year:
			(constants.AVAILABLE_YEARS.includes(Number(year)) && Number(year)) ||
			constants.DEFAULT_YEAR,
	}),
	loaderDeps: ({ search: { test, year } }) => ({ test, year }),
	loader: async ({ deps: { test, year } }) => {
		if (test) {
			const testNow = new Date(testConferenceData.start);
			const liveEvents = testLiveEvents.filter((event) =>
				isEventLive(event, testConferenceData, testNow),
			);
			const upcomingEvents = testLiveEvents.filter((event) =>
				isEventUpcoming(event, testConferenceData, 30, testNow),
			);

			return { liveEvents, upcomingEvents, year, serverBookmarks: [] };
		}
		const data = (await getAllData({ data: { year } })) as Conference;

		const liveEvents = Object.values(data.events)
			.filter((event) => isEvent(event) && isEventLive(event, data.conference))
			.sort(sortEvents);

		const upcomingEvents = Object.values(data.events)
			.filter((event) => isEvent(event) && isEventUpcoming(event, data.conference))
			.sort(sortUpcomingEvents);

		const serverBookmarks = await getBookmarks({
			data: { year, status: "favourited" },
		});

		return { liveEvents, upcomingEvents, year, serverBookmarks };
	},
	head: () => ({
		meta: [
			...generateCommonSEOTags({
				title: "Live | FOSDEM PWA",
				description: "All events that are currently live or starting soon",
			}),
		],
	}),
	staleTime: 10_000,
});

function LivePage() {
	const { liveEvents, upcomingEvents, year, serverBookmarks } = Route.useLoaderData();

	const { user } = useAuth();
	const { create: createBookmark } = useMutateBookmark({ year });
	const onCreateBookmark = async (bookmark: any) => {
		await createBookmark(bookmark);
	};

	return (
		<div className="min-h-screen">
			<div className="relative py-6 lg:py-10">
				<PageHeader
					heading="Live & Upcoming"
					text="All events that are currently live or starting soon"
					year={year}
				/>
				<div className="w-full space-y-8">
					<section>
					<EventList
						events={liveEvents}
						year={year}
						defaultViewMode="calendar"
						title="Live Now"
						user={user}
						onCreateBookmark={onCreateBookmark}
						emptyStateTitle="No live events found"
						emptyStateMessage="Come back later to see live events"
						serverBookmarks={serverBookmarks}
					/>
					</section>

					<section>
					<EventList
						events={upcomingEvents}
						year={year}
						defaultViewMode="calendar"
						title="Starting Soon"
						user={user}
						onCreateBookmark={onCreateBookmark}
						emptyStateTitle="No upcoming events found"
						emptyStateMessage="Come back later to see upcoming events"
						serverBookmarks={serverBookmarks}
					/>
					</section>
				</div>
			</div>
		</div>
	);
}
