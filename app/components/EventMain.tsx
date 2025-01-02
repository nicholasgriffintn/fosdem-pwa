'use client'

import { EventSidebar } from '~/components/EventSidebar'
import { EventPlayer } from '~/components/EventPlayer'
import { ChatAlert } from '~/components/ChatAlert'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '~/components/ui/resizable'
import { useWindowSize } from '~/hooks/use-window-size'
import type { Event, ConferenceData } from '~/types/fosdem'

export function EventMain({ event, conference }: { event: Event, conference: ConferenceData }) {
  const { width } = useWindowSize()

  return (
    <>
      {width < 768 ? (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-lg border bg-card">
            <div className="w-full">
              <EventPlayer event={event} isMobile conference={conference} />
            </div>
            {event.chat && <ChatAlert chatUrl={event.chat} />}
          </div>
          <EventSidebar event={event} isMobile />
        </div>
      ) : (
        <ResizablePanelGroup
          direction="horizontal"
          className="min-h-[200px] rounded-lg border"
        >
          <ResizablePanel defaultSize={75}>
            <div className="h-full flex flex-col">
              <div className="flex-1">
                <EventPlayer event={event} conference={conference} />
              </div>
              {event.chat && <ChatAlert chatUrl={event.chat} />}
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={25}>
            <EventSidebar event={event} />
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
      <div className="w-full">
        {event.links?.length > 0 && (
          <div className="mt-4">
            <h2 className="text-xl font-medium">Links</h2>
            <ul className="mt-2 space-y-2 list-disc list-inside">
              {event.links.map((link) => {
                return (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {link.title}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </>
  )
}