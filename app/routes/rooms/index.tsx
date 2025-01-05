import { createFileRoute, Link } from '@tanstack/react-router'
import clsx from 'clsx'

import { getAllData } from '~/functions/getFosdemData'
import type { Conference } from '~/types/fosdem'
import { constants } from '~/constants'
import { PageHeader } from '~/components/PageHeader'

export const Route = createFileRoute('/rooms/')({
  component: RoomsPage,
  validateSearch: ({ year, day }: { year: number; day: string }) => ({
    year:
      (constants.AVAILABLE_YEARS.includes(year) && year) ||
      constants.DEFAULT_YEAR,
    day: day || null,
  }),
  loaderDeps: ({ search: { year, day } }) => ({ year, day }),
  loader: async ({ deps: { year, day } }) => {
    const data = (await getAllData({ data: { year } })) as Conference
    const rooms = data.rooms

    return { fosdem: { rooms }, year, day }
  },
  head: () => ({
    meta: [
      {
        title: "Rooms | FOSDEM PWA",
        description: "All rooms at FOSDEM",
      },
    ],
  }),
  staleTime: 10_000,
})

function RoomsPage() {
  const { fosdem } = Route.useLoaderData()
  const roomKeys = fosdem.rooms ? Object.keys(fosdem.rooms) : []
  const rooms = roomKeys.map((room) => ({
    ...fosdem.rooms[room],
    id: room,
  }))

  const roomsByBuilding = rooms.reduce((acc, room) => {
    const buildingId = room.building?.id || 'Other'
    if (!acc[buildingId]) {
      acc[buildingId] = []
    }
    acc[buildingId].push(room)
    return acc
  }, {} as Record<string, typeof rooms>)

  const sortedBuildings = Object.keys(roomsByBuilding).sort((a, b) => {
    if (a === 'Other') return 1
    if (b === 'Other') return -1
    return a.localeCompare(b)
  })

  return (
    <div className="min-h-screen">
      <div className="relative py-6 lg:py-10">
        <PageHeader heading="Rooms" />
        <div className="mt-6 space-y-8">
          {sortedBuildings.map((buildingId) => (
            <div key={buildingId} className="space-y-2">
              <h2 className="text-2xl font-bold px-4">
                Building {buildingId}
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({roomsByBuilding[buildingId].length} rooms)
                </span>
              </h2>
              <div>
                {roomsByBuilding[buildingId].map((room, index) => {
                  const isLast = index === roomsByBuilding[buildingId].length - 1
                  const className = clsx("flex justify-between relative", {
                    "border-t-2 border-solid border-muted": index % 2 === 1,
                    "border-b-2": index % 2 === 1 && !isLast,
                  })

                  return (
                    <div
                      key={room.id}
                      className={className}
                    >
                      <div className="flex flex-col md:flex-row md:justify-between w-full p-4">
                        <div className="flex flex-col flex-grow">
                          <Link
                            to={`/rooms/${room.id}`}
                          >
                            <h3 className="text-xl font-semibold text-foreground hover:underline">
                              {room.name}
                            </h3>
                          </Link>
                          <div className="mt-2 space-y-1">
                            <p className="text-sm text-muted-foreground">
                              Events: {room.eventCount}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
