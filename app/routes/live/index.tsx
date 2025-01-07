import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "~/components/PageHeader";
import { EventList } from "~/components/Event/EventList";
import { getAllData } from "~/server/functions/fosdem";
import { testLiveEvents, testConferenceData } from "~/data/test-data";
import type { Conference, Event } from "~/types/fosdem";
import { constants } from "../../constants";
import { isEventLive, isEventUpcoming } from "~/lib/dateTime";
import { sortEvents, sortUpcomingEvents } from "~/lib/sorting";
import { useAuth } from "~/hooks/use-auth";
import { useBookmarks } from "~/hooks/use-bookmarks";

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

      return { liveEvents, upcomingEvents, year };
    }
    const data = (await getAllData({ data: { year } })) as Conference;

    const liveEvents = Object.values(data.events)
      .filter((event: Event) => isEventLive(event, data.conference))
      .sort(sortEvents);

    const upcomingEvents = Object.values(data.events)
      .filter((event: Event) => isEventUpcoming(event, data.conference))
      .sort(sortUpcomingEvents);

    return { liveEvents, upcomingEvents, year };
  },
  head: () => ({
    meta: [
      {
        title: "Live | FOSDEM PWA",
        description: "All events that are currently live or starting soon",
      },
    ],
  }),
  staleTime: 10_000,
});

function LivePage() {
  const { liveEvents, upcomingEvents, year } = Route.useLoaderData();

  const { user } = useAuth();
  const { create: createBookmark } = useBookmarks({
    year,
  });
  const onCreateBookmark = (bookmark: any) => {
    createBookmark(bookmark);
  };

  return (
    <div className="min-h-screen">
      <div className="relative py-6 lg:py-10">
        <PageHeader
          heading="Live & Upcoming"
          text="All events that are currently live or starting soon"
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
            />
          </section>
        </div>
      </div>
    </div>
  );
}
