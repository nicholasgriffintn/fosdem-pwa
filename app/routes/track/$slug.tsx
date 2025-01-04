import { createFileRoute } from "@tanstack/react-router";

import { getAllData } from "~/functions/getFosdemData";
import { PageHeader } from "~/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { EventList } from "~/components/EventList";
import type { Conference, Event } from "~/types/fosdem";
import { groupByDay } from "~/lib/fosdem";
import { constants } from "../../constants";

function get24HrFormat(str: string) {
  const _t = str.split(/[^0-9]/g);
  _t[0] = String(+_t[0] + (str.indexOf("pm") > -1 && +_t[0] !== 12 ? 12 : 0));
  return _t.join("");
}

export const Route = createFileRoute("/track/$slug")({
  component: TrackPage,
  validateSearch: ({ year, day }: { year: number; day: string }) => ({
    year:
      (constants.AVAILABLE_YEARS.includes(year) && year) ||
      constants.DEFAULT_YEAR,
    day: day || null,
  }),
  loaderDeps: ({ search: { year, day } }) => ({ year, day }),
  loader: async ({ params, deps: { year, day } }) => {
    const data = (await getAllData({ data: { year } })) as Conference;
    const days = Object.values(data.days);
    const track = data.tracks[params.slug];
    const type = data.types[track?.type];

    const eventData = Object.values(data.events).filter(
      (event: any): event is Event => event.trackKey === params.slug,
    );

    const eventDataSplitByDay = groupByDay(eventData, (event) => event.day);

    return { fosdem: { days, track, type, eventDataSplitByDay }, year, day };
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

  console.log(fosdem.track);

  return (
    <div className="min-h-screen">
      <div className="relative py-6 lg:py-10">
        <PageHeader
          heading={fosdem.track.name}
          breadcrumbs={[
            { title: fosdem.type.name, href: `/type/${fosdem.type.id}` },
          ]}
          metadata={[
            `Type: ${fosdem.type.name}`,
            `Room: ${fosdem.track.room}`,
            `Day ${Array.isArray(fosdem.track.day) ? fosdem.track.day.join(" and ") : fosdem.track.day}`,
            `Events: ${fosdem.track.eventCount}`,
          ]}
        />
        <Tabs
          defaultValue={
            day?.toString() ||
            Object.keys(fosdem.eventDataSplitByDay)[0] ||
            fosdem.days[0].id
          }
          className="w-full"
        >
          <TabsList>
            {fosdem.days.map((day) => {
              const hasEvents = Boolean(fosdem.eventDataSplitByDay[day.id]);
              return (
                <TabsTrigger key={day.id} value={day.id} disabled={!hasEvents}>
                  {day.name}
                </TabsTrigger>
              );
            })}
          </TabsList>
          {fosdem.days.map((day) => {
            if (!fosdem.eventDataSplitByDay[day.id]) {
              return (
                <TabsContent key={day.id} value={day.id}>
                  <p>
                    No events are currently scheduled for this day, check the
                    next day instead. Or check back later for updates.
                  </p>
                </TabsContent>
              );
            }

            const event = fosdem.eventDataSplitByDay[day.id]?.sort((a, b) => {
              const t1 = get24HrFormat(a.startTime);
              const t2 = get24HrFormat(b.startTime);
              return t1 > t2 ? 1 : t1 < t2 ? -1 : 0;
            });

            return (
              <TabsContent key={day.id} value={day.id}>
                <EventList events={event} year={year} />
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
}
