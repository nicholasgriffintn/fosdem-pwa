import { EventList } from "~/components/Event/EventList";
import { TrackList } from "~/components/Track/TrackList";
import { Spinner } from "~/components/Spinner";
import type { Conference, Track, Event } from "~/types/fosdem";
import { detectEventConflicts } from "~/lib/fosdem";
import { sortEvents, sortTracks } from "~/lib/sorting";

type Bookmark = {
  id: string;
  slug: string;
  user_id: number;
  type: "bookmark_event" | "bookmark_track";
  status: string;
  year: number;
  created_at: string;
  updated_at: string;
  priority?: number | null;
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

type BookmarksListProps = {
  bookmarks: Bookmark[];
  fosdemData?: Conference;
  year: number;
  loading: boolean;
  day?: string;
  onUpdateBookmark?: (params: { id: string; updates: Partial<Bookmark> }) => void;
  showConflicts?: boolean;
  defaultViewMode?: "list" | "schedule" | "calendar";
  showViewMode?: boolean;
};

export function BookmarksList({
  bookmarks,
  fosdemData,
  year,
  loading,
  day,
  onUpdateBookmark,
  showConflicts = true,
  defaultViewMode = "calendar",
  showViewMode = true,
}: BookmarksListProps) {
  const organizedBookmarks =
    bookmarks && bookmarks.length > 0 ? organizeBookmarks(bookmarks) : {};

  const handleSetPriority = (eventId: string, updates: { priority: number | null }) => {
    const bookmark = bookmarks.find(b => {
      const event = fosdemData?.events[b.slug];
      return event?.id === eventId;
    });

    if (bookmark && onUpdateBookmark) {
      onUpdateBookmark({ id: bookmark.id, updates });
    }
  };

  const getFormattedData = () => {
    if (!bookmarks?.length || !fosdemData) {
      return { tracks: [], events: [], conflicts: [] };
    }

    const bookmarkedEvents = organizedBookmarks[year]?.events || [];
    const bookmarkedTracks = organizedBookmarks[year]?.tracks || [];

    const formattedEvents = bookmarkedEvents
      .map((bookmark) => {
        const event = fosdemData.events[bookmark.slug];
        if (!event) return null;
        return {
          ...event,
          priority: bookmark.priority,
        } as Event;
      })
      .filter((event): event is NonNullable<typeof event> => event !== null)
      .sort(sortEvents);

    const conflicts = showConflicts ? detectEventConflicts(formattedEvents, fosdemData.conference) : [];

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
        } as Track;
      })
      .filter((track): track is NonNullable<typeof track> => track !== null)
      .sort(sortTracks);

    return { tracks: formattedTracks, events: formattedEvents, conflicts };
  };

  const { tracks, events, conflicts } = getFormattedData();
  const days = fosdemData ? Object.values(fosdemData.days) : [];

  return (
    <>
      {loading ? (
        <div className="flex justify-center items-center">
          <Spinner className="h-8 w-8" />
        </div>
      ) : bookmarks?.length ? (
        <div className="space-y-8">
          {tracks.length > 0 && (
            <TrackList tracks={tracks} year={year} title="Bookmarked Tracks" day={day} />
          )}
          {events.length > 0 && (
            <EventList
              events={events}
              year={year}
              conflicts={conflicts}
              title="Bookmarked Events"
              groupByDay={true}
              days={days}
              day={day}
              onSetPriority={handleSetPriority}
              showTrack={true}
              defaultViewMode={defaultViewMode}
              displayViewMode={showViewMode}
            />
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
