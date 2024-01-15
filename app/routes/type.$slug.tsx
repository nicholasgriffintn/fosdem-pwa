import type { MetaFunction, LoaderFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';
import {
  useLoaderData,
  useRouteLoaderData,
  useNavigate,
} from '@remix-run/react';

import { PageHeader } from '~/components/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { TrackList } from '~/components/TrackList';

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

  if (!fosdem) return null;

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