import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "~/components/PageHeader";
import { EventList } from "~/components/Event/EventList";
import { getAllData } from "~/functions/getFosdemData";
import { testLiveEvent } from "~/data/test-data";
import type { Conference, Event } from "~/types/fosdem";
import { constants } from "../../constants";
import { isEventLive } from "~/lib/eventTiming";

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
      return { liveEvents: [testLiveEvent], year };
    }
    const data = (await getAllData({ data: { year } })) as Conference;
    const liveEvents = Object.values(data.events).filter(
      (event: Event) => isEventLive(event, data.conference)
    );
    return { liveEvents, year };
  },
  head: () => ({
    meta: [
      {
        title: "Live | FOSDEM PWA",
        description: "All events that are currently live",
      },
    ],
  }),
  staleTime: 10_000,
});

function LivePage() {
  const { liveEvents, year } = Route.useLoaderData();

  return (
    <div className="min-h-screen">
      <div className="relative py-6 lg:py-10">
        <PageHeader
          heading="Live"
          text={"All events that are currently live"}
        />
        <div className="w-full">
          {liveEvents.length > 0 ? (
            <EventList events={liveEvents} year={year} />
          ) : (
            <div>No live events found</div>
          )}
        </div>
      </div>
    </div>
  );
}
