import { createFileRoute } from '@tanstack/react-router'

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '~/components/ui/resizable'
import { PageHeader } from '~/components/PageHeader'
import { Icons } from '~/components/Icons'
import { useWindowSize } from '~/hooks/use-window-size'
import { FavouriteButton } from '~/components/FavouriteButton'
import { ShareButton } from '~/components/ShareButton'
import { getEventData, getTestEventData } from '~/functions/getFosdemData'
import { EventSidebar } from '~/components/EventSidebar'
import { EventPlayer } from '~/components/EventPlayer'

export const Route = createFileRoute('/event/$slug')({
  component: TrackPage,
  validateSearch: ({ test }) => ({ test: test === true }),
  loaderDeps: ({ search: { test } }) => ({ test }),
  loader: async ({ params, deps: { test } }) => {
    if (test) {
      const fosdem = await getTestEventData({})

      return { fosdem: fosdem ?? {} }
    }

    const fosdem = await getEventData({
      data: { year: '2025', slug: params.slug },
    })
    return { fosdem: fosdem ?? {} }
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `${loaderData?.fosdem.event.title} | FOSDEM PWA`,
        description: loaderData?.fosdem.event.description,
      },
    ],
  }),
  staleTime: 10_000,
})

function TrackPage() {
  const { fosdem } = Route.useLoaderData()
  const { width } = useWindowSize()

  if (!fosdem.event) {
    return <div>Loading...</div>
  }

  const isFavourite = {
    status: 'null',
    slug: fosdem.event.slug,
  }

  const ChatAlert = () => (
    <div className="border-t bg-card px-4 py-3">
      <div className="flex items-center gap-2">
        <Icons.logo className="h-4 w-4" />
        <span className="font-medium">Get involved in the conversation!</span>
        <a
          href={fosdem.event.chat}
          target="_blank"
          rel="noreferrer"
          className="text-primary hover:underline ml-1"
        >
          Click here to join the chat
        </a>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen">
      <div className="relative py-6 lg:py-10">
        <PageHeader
          heading={fosdem.event.title}
          text={`Day ${fosdem.event.day} | ${fosdem.event.startTime} | ${fosdem.event.duration} | ${fosdem.event.room
            }${fosdem.event.persons?.length > 0 && ` | ${fosdem.event.persons.join(', ')}`}`}
        >
          <div className="flex items-center pl-6 pr-3 gap-2">
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
          {width < 768 ? (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-lg border">
                <EventPlayer event={fosdem.event} isMobile />
                {fosdem.event.chat && <ChatAlert />}
              </div>
              <EventSidebar event={fosdem.event} isMobile />
            </div>
          ) : (
            <ResizablePanelGroup
              direction="horizontal"
              className="min-h-[200px] rounded-lg border"
            >
              <ResizablePanel defaultSize={75}>
                <div className="h-full flex flex-col">
                  <div className="flex-1">
                    <EventPlayer event={fosdem.event} />
                  </div>
                  {fosdem.event.chat && <ChatAlert />}
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={25}>
                <EventSidebar event={fosdem.event} />
              </ResizablePanel>
            </ResizablePanelGroup>
          )}
        </div>
      </div>
    </div>
  )
}
