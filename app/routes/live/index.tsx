import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "~/components/PageHeader";
import { EventList } from "~/components/Event/EventList";
import { getAllData } from "~/functions/getFosdemData";
import { testLiveEvents, testConferenceData } from "~/data/test-data";
import type { Conference, Event } from "~/types/fosdem";
import { constants } from "../../constants";
import { isEventLive, isEventUpcoming } from "~/lib/eventTiming";
import { sortEvents, sortUpcomingEvents } from "~/lib/sorting";

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
        isEventLive(event, testConferenceData, testNow)
      );
      const upcomingEvents = testLiveEvents.filter((event) =>
        isEventUpcoming(event, testConferenceData, 30, testNow)
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

  return (
    <div className="min-h-screen">
      <div className="relative py-6 lg:py-10">
        <PageHeader
          heading="Live & Upcoming"
          text="All events that are currently live or starting soon"
        />
        <div className="w-full space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4">Live Now</h2>
            {liveEvents.length > 0 ? (
              <EventList events={liveEvents} year={year} />
            ) : (
              <div className="text-muted-foreground">No live events at the moment</div>
            )}
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Starting Soon</h2>
            {upcomingEvents.length > 0 ? (
              <EventList events={upcomingEvents} year={year} />
            ) : (
              <div className="text-muted-foreground">No upcoming events in the next 30 minutes</div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
