import type { MetaFunction, LoaderFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';
import { useLoaderData, useRouteLoaderData } from '@remix-run/react';

import { PageHeader } from '~/components/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { EventList } from '~/components/EventList';

export const meta: MetaFunction = () => {
  return [
    { title: 'Events - FOSDEM 2024' },
    { name: 'description', content: 'The list of events available' },
  ];
};

export const loader = async ({ params }: LoaderFunctionArgs) => {
  return json({ slug: params.slug });
};

export default function TrackPage() {
  const { slug } = useLoaderData<typeof loader>();
  const { fosdem } = useRouteLoaderData('root');

  if (!fosdem) return null;

  const days = Object.values(fosdem.days);

  const track = fosdem.tracks[slug];

  const type = fosdem.types[track.type];

  function get24HrFormat(str) {
    const _t = str.split(/[^0-9]/g);
    _t[0] = +_t[0] + (str.indexOf('pm') > -1 && +_t[0] !== 12 ? 12 : 0);
    return _t.join('');
  }

  const eventData = Object.values(fosdem.events).filter(
    (event) => event.trackKey === slug
  );

  const eventDataSplitByDay = eventData.reduce((acc, event) => {
    if (!acc[event.day]) {
      acc[event.day] = [];
    }
    acc[event.day].push(event);
    return acc;
  }, []);

  return (
    <div className="min-h-screen">
      <div className="relative py-6 lg:py-10">
        <PageHeader
          heading={track.name}
          text={`${type.name} | Room: ${track.room} | Day ${track.day.join(
            ' and '
          )}`}
        />
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
            const event = eventDataSplitByDay[day.id]?.sort(function (a, b) {
              const t1 = get24HrFormat(a.startTime);
              const t2 = get24HrFormat(b.startTime);
              return t1 > t2 ? 1 : t1 < t2 ? -1 : 0;
            });

            return (
              <TabsContent key={day.id} value={day.id}>
                <EventList events={event} />
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
}
