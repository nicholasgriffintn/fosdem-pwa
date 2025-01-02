import { createFileRoute } from '@tanstack/react-router'

import { PageHeader } from '~/components/PageHeader'
import { FavouriteButton } from '~/components/FavouriteButton'
import { ShareButton } from '~/components/ShareButton'
import { testLiveEvent } from '~/data/test-data'
import { getAllData } from '~/functions/getFosdemData'
import { EventMain } from '~/components/EventMain'
import { constants } from '~/constants'

export const Route = createFileRoute('/event/$slug')({
  component: TrackPage,
  validateSearch: ({ test, year }: { test: boolean, year: string }) => ({
    test: test === true,
    year: constants.AVAILABLE_YEARS.includes(Number(year)) && Number(year) || constants.DEFAULT_YEAR
  }),
  loaderDeps: ({ search: { test, year } }) => ({ test, year }),
  loader: async ({ params, deps: { test, year } }) => {
    if (test) {
      return { fosdem: { event: testLiveEvent } }
    }

    const fosdem = await getAllData({ data: { year } });
    return { fosdem: { event: fosdem.events[params.slug] } };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `${loaderData?.fosdem.event?.title} | FOSDEM PWA`,
        description: loaderData?.fosdem.event?.description,
      },
    ],
  }),
  staleTime: 10_000,
})

function TrackPage() {
  const { fosdem } = Route.useLoaderData()

  if (!fosdem.event?.title) {
    return (
      <div className="min-h-screen">
        <div className="relative py-6 lg:py-10">
          <PageHeader heading="Event not found" />
        </div>
      </div>
    )
  }

  const isFavourite = {
    status: 'null',
    slug: fosdem.event.slug,
  }

  return (
    <div className="min-h-screen">
      <div className="relative py-6 lg:py-10">
        <PageHeader
          heading={fosdem.event.title}
          text={`Day ${fosdem.event.day} | ${fosdem.event.startTime} | ${fosdem.event.duration} | ${fosdem.event.room
            }${fosdem.event.persons?.length > 0 && ` | ${fosdem.event.persons.join(', ')}`}`}
        >
          <div className="flex items-center md:pl-6 md:pr-3 gap-2">
            <FavouriteButton
              type="event"
              slug={fosdem.event.slug}
              status={isFavourite?.status ?? 'unfavourited'}
            />
            <ShareButton
              title={fosdem.event.title}
              text={`Check out ${fosdem.event.title} at FOSDEM`}
              url={`https://fosdempwa.com/event/${fosdem.event.id}`}
            />
          </div>
        </PageHeader>
        <div className="w-full">
          <EventMain event={fosdem.event} />
        </div>
      </div>
    </div>
  )
}
