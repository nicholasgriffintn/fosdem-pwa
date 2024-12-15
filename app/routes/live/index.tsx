import { createFileRoute } from '@tanstack/react-router'

import { PageHeader } from '~/components/PageHeader'
import { getLiveData } from '../../functions/getFosdemData';
import { EventList } from '~/components/EventList'

export const Route = createFileRoute('/live/')({
  component: LivePage,
  validateSearch: ({ test }) => ({ test: test === true }),
  loaderDeps: ({ search: { test } }) => ({ test }),
  loader: async ({ deps: { test } }) => {
    const liveEvents = await getLiveData({ data: { year: '2025', test } });
    return liveEvents;
  },
  head: ({ }) => ({
    meta: [
      {
        title: `Live | FOSDEM PWA`,
        description: 'All events that are currently live',
      },
    ],
  }),
  staleTime: 10_000,
})

function LivePage() {
  const { liveEvents } = Route.useLoaderData()

  return (
    <div className="min-h-screen">
      <div className="relative py-6 lg:py-10">
        <PageHeader
          heading="Live"
          text={`All events that are currently live`}
        />
        <div className="w-full">
          {liveEvents.length > 0 ? (
            <EventList events={liveEvents} />
          ) : (
            <div>No live events found</div>
          )}
        </div>
      </div>
    </div>
  )
}
