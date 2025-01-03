import { EventList } from "~/components/EventList";
import { TrackList } from "~/components/TrackList";
import { Spinner } from "~/components/Spinner";
import type { Conference } from "~/types/fosdem";

interface Bookmark {
  id: string;
  slug: string;
  user_id: number;
  type: "bookmark_event" | "bookmark_track";
  status: string;
  year: number;
  created_at: string;
  updated_at: string;
}

function organizeBookmarks(bookmarks: Bookmark[]) {
  const byYear = bookmarks.reduce(
    (acc, bookmark) => {
      if (!acc[bookmark.year]) {
        acc[bookmark.year] = {
          events: [],
          tracks: [],
        };
      }

      if (bookmark.type === "bookmark_event") {
        acc[bookmark.year].events.push(bookmark);
      } else if (bookmark.type === "bookmark_track") {
        acc[bookmark.year].tracks.push(bookmark);
      }

      return acc;
    },
    {} as Record<number, { events: Bookmark[]; tracks: Bookmark[] }>,
  );

  return byYear;
}

export function BookmarksList({
  bookmarks,
  fosdemData,
  year,
  loading,
}: {
  bookmarks: Bookmark[];
  fosdemData?: Conference;
  year: number;
  loading: boolean;
}) {
  const organizedBookmarks =
    bookmarks && bookmarks.length > 0 ? organizeBookmarks(bookmarks) : {};

  const getFormattedData = () => {
    if (!bookmarks?.length || !fosdemData) return { tracks: [], events: [] };

    const bookmarkedEvents = organizedBookmarks[year]?.events || [];
    const bookmarkedTracks = organizedBookmarks[year]?.tracks || [];

    const formattedEvents = bookmarkedEvents
      .map((bookmark) => {
        const event = fosdemData.events[bookmark.slug];
        if (!event) return null;
        return {
          id: event.id,
          title: event.title,
          startTime: event.startTime,
          duration: event.duration,
          room: event.room,
          persons: event.persons,
        };
      })
      .filter((event): event is NonNullable<typeof event> => event !== null);

    const formattedTracks = bookmarkedTracks
      .map((bookmark) => {
        const track = fosdemData.tracks[bookmark.slug];
        if (!track) return null;
        return {
          id: track.id,
          name: track.name,
          room: track.room,
          eventCount: Object.values(fosdemData.events).filter(
            (event) => event.trackKey === track.name,
          ).length,
        };
      })
      .filter((track): track is NonNullable<typeof track> => track !== null);

    return { tracks: formattedTracks, events: formattedEvents };
  };

  const { tracks, events } = getFormattedData();

  return (
    <>
      {loading ? (
        <div className="flex justify-center items-center h-screen">
          <Spinner />
        </div>
      ) : bookmarks?.length ? (
        <div className="space-y-8">
          {tracks.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4">
                Bookmarked Tracks
              </h2>
              <TrackList tracks={tracks} year={year} />
            </section>
          )}
          {events.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4">
                Bookmarked Events
              </h2>
              <EventList events={events} year={year} />
            </section>
          )}
        </div>
      ) : (
        <div className="text-center py-2 mb-4">
          <p>You haven't bookmarked anything yet!</p>
        </div>
      )}
    </>
  );
}
