import { createFileRoute, useSearch } from '@tanstack/react-router'
import Fuse from 'fuse.js'

import { useFosdemData } from '~/hooks/use-fosdem-data'
import { EventList } from '~/components/EventList'
import { TrackList } from '~/components/TrackList'
import { Spinner } from '~/components/Spinner'

interface SearchParams {
  q?: string
}

export const Route = createFileRoute('/search/')({
  component: SearchPage,
  head: () => ({
    meta: [
      {
        title: 'Search | FOSDEM PWA',
        description: 'Search for events and tracks at FOSDEM PWA',
      },
    ],
  }),
})

export default function SearchPage() {
  const { fosdemData, loading } = useFosdemData()
  const search = useSearch({ from: '/search/' }) as SearchParams
  const query = search.q || ''

  const getSearchResults = () => {
    if (!fosdemData || !query) return { tracks: [], events: [] }

    const tracksFuse = new Fuse(Object.values(fosdemData.tracks), {
      keys: ['name', 'type', 'description'],
      threshold: 0.3,
    })

    const eventsFuse = new Fuse(Object.values(fosdemData.events), {
      keys: ['title', 'persons', 'abstract', 'description'],
      threshold: 0.3,
    })

    const tracksResults = tracksFuse.search(query).map((result) => result.item)
    const eventsResults = eventsFuse.search(query).map((result) => result.item)

    return {
      tracks: tracksResults,
      events: eventsResults,
    }
  }

  const { tracks, events } = getSearchResults()

  const formattedTracks = tracks.map((track) => ({
    id: track.id,
    name: track.name,
    room: track.room,
    eventCount: Object.values(fosdemData?.events || {}).filter(
      (event) => event.trackKey === track.name,
    ).length,
  }))

  const formattedEvents = events.map((event) => ({
    id: event.id,
    title: event.title,
    startTime: event.startTime,
    duration: event.duration,
    room: event.room,
    persons: event.persons,
  }))

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-4">Search Results for "{query}"</h1>
      {loading ? (
        <div className="flex justify-center items-center h-screen">
          <Spinner className="h-8 w-8" />
        </div>
      ) : tracks.length === 0 && events.length === 0 ? (
        <p className="text-muted-foreground">No results found.</p>
      ) : (
        <div className="space-y-8">
          {tracks.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4">Tracks</h2>
              <TrackList tracks={formattedTracks} />
            </section>
          )}
          {events.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4">Events</h2>
              <EventList events={formattedEvents} />
            </section>
          )}
        </div>
      )}
    </div>
  )
}
