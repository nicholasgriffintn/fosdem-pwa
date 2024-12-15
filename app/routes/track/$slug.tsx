import { createFileRoute } from '@tanstack/react-router'

import { getTrackData } from '~/functions/getFosdemData'
import { PageHeader } from '~/components/PageHeader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { EventList } from '~/components/EventList'

function get24HrFormat(str) {
  const _t = str.split(/[^0-9]/g);
  _t[0] = +_t[0] + (str.indexOf('pm') > -1 && +_t[0] !== 12 ? 12 : 0);
  return _t.join('');
}

export const Route = createFileRoute('/track/$slug')({
  component: TrackPage,
  loader: async ({ params }) => {
    const fosdem = await getTrackData({
      data: { year: '2025', slug: params.slug },
    })
    return { fosdem: fosdem ?? {} }
  },
  staleTime: 10_000,
})

function TrackPage() {
  const { fosdem } = Route.useLoaderData()

  if (!fosdem.track || !fosdem.type) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen">
      <div className="relative py-6 lg:py-10">
        <PageHeader
          heading={fosdem.track.name}
          text={`${fosdem.type.name} | Room: ${fosdem.track.room} | Day ${fosdem.track.day.join(
            ' and '
          )}`}
        />
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
            if (!fosdem.trackDataSplitByDay[day.id]) {
              return null;
            }

            const event = fosdem.trackDataSplitByDay[day.id]?.sort(function (a, b) {
              const t1 = get24HrFormat(a.startTime);
              const t2 = get24HrFormat(b.startTime);
              return t1 > t2 ? 1 : t1 < t2 ? -1 : 0;
            });

            return (
              <TabsContent key={day.id} value={day.id}>
                <EventList events={event} favourites={{}} />
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  )
}
