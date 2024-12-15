import { createFileRoute } from '@tanstack/react-router'

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '~/components/ui/resizable'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { PageHeader } from '~/components/PageHeader'
import { Icons } from '~/components/Icons'
import { useWindowSize } from '~/hooks/use-window-size'
import { FavouriteButton } from '~/components/FavouriteButton'
import { ShareButton } from '~/components/ShareButton'
import { getEventData } from '~/functions/getFosdemData'
import { EventSidebar } from '~/components/EventSidebar'
import { EventPlayer } from '~/components/EventPlayer'

export const Route = createFileRoute('/event/$slug')({
  component: TrackPage,
  loader: async ({ params }) => {
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

  if (!fosdem.event) {
    return <div>Loading...</div>
  }

  const { width } = useWindowSize()

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
            <>
              <EventPlayer event={fosdem.event} isMobile />
              <EventSidebar event={fosdem.event} isMobile />
            </>
          ) : (
            <ResizablePanelGroup
              direction="horizontal"
              className="min-h-[200px] rounded-lg border"
            >
              <ResizablePanel defaultSize={75}>
                <EventPlayer event={fosdem.event} />
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={25}>
                <EventSidebar event={fosdem.event} />
              </ResizablePanel>
            </ResizablePanelGroup>
          )}
          {fosdem.event.chat && (
            <Alert className="mt-4">
              <Icons.logo className="h-4 w-4" />
              <AlertTitle>Get involved in the conversation!</AlertTitle>
              <AlertDescription>
                <a
                  href={fosdem.event.chat}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  Click here to join the chat
                </a>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  )
}
