import { createFileRoute } from '@tanstack/react-router'
import { useRef } from 'react'

import { constants } from '~/constants'
import { EventList } from '~/components/Event/EventList'
import { RoomPlayer } from '~/components/Room/RoomPlayer'
import { RoomStatus } from '~/components/Room/RoomStatus'
import { getAllData } from '~/functions/getFosdemData'
import type { Conference, Event } from '~/types/fosdem'
import { PageHeader } from '../../components/PageHeader'

export const Route = createFileRoute('/rooms/$roomId')({
  component: RoomPage,
  validateSearch: ({ year, day }: { year: number; day: string }) => ({
    year:
      (constants.AVAILABLE_YEARS.includes(year) && year) ||
      constants.DEFAULT_YEAR,
    day: day || null,
  }),
  loaderDeps: ({ search: { year, day } }) => ({ year, day }),
  loader: async ({ params, deps: { year, day } }) => {
    const data = (await getAllData({ data: { year } })) as Conference
    const room = data.rooms[params.roomId]

    const roomEvents = Object.values(data.events).filter(
      (event: Event): event is Event => event.room === params.roomId,
    )

    return { fosdem: { room, roomEvents }, year, day }
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `${loaderData?.fosdem.room?.name} | FOSDEM PWA`,
        description: `Events in ${loaderData?.fosdem.room?.name}`,
      },
    ],
  }),
  staleTime: 10_000,
})

function RoomPage() {
  const { fosdem } = Route.useLoaderData()
  const videoRef = useRef<HTMLVideoElement>(null)

  const roomEvents = fosdem.roomEvents
  const roomInfo = fosdem.room

  return (
    <div className="min-h-screen">
      <div className="relative py-6 lg:py-10">
        <PageHeader
          heading={`Room ${roomInfo.name || roomInfo.slug}`}
          metadata={[
            {
              text: `Building ${roomInfo.buildingId || roomInfo.building?.id}`,
            },
            {
              text: `${roomInfo.eventCount} events`,
            },
          ]}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2">
            <RoomPlayer roomId={roomInfo.slug} videoRef={videoRef} />
          </div>

          <div className="space-y-6">
            <div>
              <RoomStatus roomId={roomInfo.slug} />
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">Quick Links</h2>
              <div className="flex flex-col space-y-2">
                <a
                  href={constants.CHAT_LINK.replace(
                    '${ROOM_ID}',
                    roomInfo.slug,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Join Chat
                </a>
                <a
                  href={constants.NAVIGATE_TO_LOCATION_LINK.replace(
                    '${LOCATION_ID}',
                    roomInfo.slug,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Navigate to Room
                </a>
              </div>
            </div>
          </div>
        </div>

        <div>
          <EventList
            events={roomEvents}
            year={constants.DEFAULT_YEAR}
            title={`Events in ${roomInfo?.name || roomInfo.slug}`}
            defaultViewMode="calendar"
            displayViewMode={true}
          />
        </div>
      </div>
    </div>
  )
}
