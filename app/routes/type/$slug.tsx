import { createFileRoute } from "@tanstack/react-router";

import { getTypesData } from "~/functions/getFosdemData";
import { PageHeader } from "~/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { TrackList } from '~/components/TrackList';

export const Route = createFileRoute("/type/$slug")({
  component: TypePage,
  loader: async ({ params }) => {
    const fosdem = await getTypesData({ data: { year: '2025', slug: params.slug } });
    return { fosdem: fosdem ?? {} }
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `${loaderData?.fosdem.type.name} | FOSDEM PWA`,
        description: loaderData?.fosdem.type.description,
      },
    ],
  }),
  staleTime: 10_000,
});

function TypePage() {
  const { fosdem } = Route.useLoaderData();

  if (!fosdem.type) {
    return <div>Loading...</div>;
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