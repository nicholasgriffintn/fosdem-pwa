import type { MetaFunction, LoaderFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';
import {
  useLoaderData,
  useRouteLoaderData,
  useNavigate,
} from '@remix-run/react';

import { PageHeader } from '~/components/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';

export const meta: MetaFunction = () => {
  return [
    { title: 'Tracks - FOSDEM 2024' },
    { name: 'description', content: 'The list of tracks available' },
  ];
};

export const loader = async ({ params }: LoaderFunctionArgs) => {
  return json({ slug: params.slug });
};

export default function TrackPage() {
  const navigate = useNavigate();

  const { slug } = useLoaderData<typeof loader>();
  const { fosdem } = useRouteLoaderData('root');

  const days = Object.values(fosdem.days);

  const type = fosdem.types[slug];

  const trackData = Object.values(fosdem.tracks).filter(
    (track) => track.type === slug
  );

  const trackDataSplitByDay = trackData.reduce((acc, track) => {
    if (!acc[track.day]) {
      acc[track.day] = [];
    }
    acc[track.day].push(track);
    return acc;
  }, []);

  return (
    <div className="min-h-screen">
      <div className="relative py-6 lg:py-10">
        <PageHeader heading={type.name} />
        <Tabs defaultValue={days[0].id} className="w-full">
          <TabsList>
            {days.map((day) => {
              return (
                <TabsTrigger key={day.id} value={day.id}>
                  {day.name}
                </TabsTrigger>
              );
            })}
          </TabsList>
          {days.map((day) => {
            const event = trackDataSplitByDay[day.id];

            if (!event) {
              return (
                <TabsContent key={day.id} value={day.id}>
                  <div className="flex flex-wrap -mx-1 lg:-mx-4">
                    <div className="my-1 px-1 w-full md:w-1/2 lg:my-4 lg:px-4 lg:w-1/3">
                      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                        <div className="p-4">
                          <p className="text-3xl text-gray-900">
                            No events for this day
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              );
            }

            return (
              <TabsContent key={day.id} value={day.id}>
                <div className="flex flex-wrap -mx-1 lg:-mx-4">
                  {event.map((track) => {
                    return (
                      <div
                        key={track.id}
                        className="my-1 px-1 w-full md:w-1/2 lg:my-4 lg:px-4 lg:w-1/3"
                      >
                        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                          <div className="p-4">
                            <p className="uppercase tracking-wide text-sm font-bold text-gray-700">
                              {track.type} | DAY {track.day.join(' and ')}
                            </p>
                            <p className="text-3xl text-gray-900">
                              {track.name}
                            </p>
                            <p className="text-gray-700">{track.description}</p>
                            <p className="text-gray-700">
                              {track.eventCount} events | {track.room}
                            </p>
                            <div>
                              <button
                                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                onClick={() => navigate(`/track/${track.id}`)}
                              >
                                View Track
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
}
