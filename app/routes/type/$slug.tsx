import { createFileRoute } from "@tanstack/react-router";

import { getAllData } from "~/functions/getFosdemData";
import { PageHeader } from "~/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { TrackList } from '~/components/TrackList';
import { Conference, Track } from '~/types/fosdem';
import { groupByDay } from '~/lib/fosdem';

export const Route = createFileRoute("/type/$slug")({
  component: TypePage,
  loader: async ({ params }) => {
    const data = await getAllData({ data: { year: '2025' } }) as Conference;
    const days = Object.values(data.days);
    const type = data.types[params.slug];

    const trackData = Object.values(data.tracks).filter(
      (track: any): track is Track => track.type === params.slug
    );

    const trackDataSplitByDay = groupByDay(trackData, track => track.day);

    return { fosdem: { days, type, trackDataSplitByDay } };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `${loaderData?.fosdem.type?.name} | FOSDEM PWA`,
        description: loaderData?.fosdem.type?.description,
      },
    ],
  }),
  staleTime: 10_000,
});

function TypePage() {
  const { fosdem } = Route.useLoaderData();

  if (!fosdem.type) {
    return (
      <div className="min-h-screen">
        <div className="relative py-6 lg:py-10">
          <PageHeader heading="Type not found" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" >
      <div className="relative py-6 lg:py-10" >
        <PageHeader heading={fosdem.type.name} />
        <Tabs defaultValue={fosdem.days[0].id} className="w-full">
          <TabsList>
            {fosdem.days.map((day) => {
              return (
                <TabsTrigger key={day.id} value={day.id}>
                  {day.name}
                </TabsTrigger>
              );
            })}
          </TabsList>
          {fosdem.days.map((day) => {
            const event = fosdem.trackDataSplitByDay[day.id];

            return (
              <TabsContent key={day.id} value={day.id}>
                <TrackList tracks={event} />
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
}