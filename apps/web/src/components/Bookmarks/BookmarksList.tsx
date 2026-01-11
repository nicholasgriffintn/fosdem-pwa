import { Link } from "@tanstack/react-router";
import { useMemo } from "react";

import { LoadingState } from "~/components/shared/LoadingState";
import { EventList } from "~/components/Event/EventList";
import { TrackList } from "~/components/Track/TrackList";
import { WatchLaterList } from "~/components/WatchLater/WatchLaterList";
import type { Conference, Track, Event } from "~/types/fosdem";
import { detectEventConflicts } from "~/lib/fosdem";
import { sortEvents, sortTracks } from "~/lib/sorting";
import type { User } from "~/server/db/schema";
import type { Bookmark } from "~/server/db/schema";
import type { LocalBookmark } from "~/lib/localStorage";
import { EmptyStateCard } from "~/components/shared/EmptyStateCard";
import { isEvent, isTrack } from "~/lib/type-guards";
import { cn } from "~/lib/utils";

const tabBaseClass =
  "inline-flex h-10 items-center justify-center whitespace-nowrap rounded-lg px-3 text-sm font-medium transition-all no-underline backdrop-blur-sm";
const tabActiveClass =
  "bg-secondary text-foreground shadow-lg shadow-black/5 dark:shadow-black/20 border border-white/20 dark:border-white/10";
const tabInactiveClass =
  "text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-white/5";

type BookmarkListItem = (Bookmark | LocalBookmark) & { serverId?: string };

function organizeBookmarks(bookmarks: BookmarkListItem[]) {
  const byYear = bookmarks.reduce(
    (acc, bookmark) => {
      if (!acc[bookmark.year]) {
        acc[bookmark.year] = {
          events: [],
          tracks: [],
        };
      }

      if (bookmark.type === "bookmark_event" || bookmark.type === "event") {
        acc[bookmark.year].events.push(bookmark);
      } else if (bookmark.type === "bookmark_track" || bookmark.type === "track") {
        acc[bookmark.year].tracks.push(bookmark);
      }

      return acc;
    },
    {} as Record<
      number,
      {
        events: (Bookmark | LocalBookmark)[];
        tracks: (Bookmark | LocalBookmark)[];
      }
    >,
  );

  return byYear;
}

type BookmarksListProps = {
  bookmarks?: BookmarkListItem[];
  fosdemData?: Conference;
  year: number;
  loading: boolean;
  day?: string;
  view?: string;
  tab?: "events" | "tracks" | "all" | "watch-later";
  headerActions?: React.ReactNode;
  watchLaterItems?: BookmarkListItem[];
  watchLaterLoading?: boolean;
  onUpdateBookmark?: (params: {
    id: string;
    serverId?: string;
    updates: Partial<Bookmark | LocalBookmark>;
  }) => void;
  showConflicts?: boolean;
  scheduleShowConflictIndicators?: boolean;
  defaultViewMode?: "list" | "schedule" | "calendar";
  showViewMode?: boolean;
  user?: User | null;
  title?: string;
  emptyStateTitle?: string;
  emptyStateMessage?: string;
  onCreateBookmark?: ({
    type,
    slug,
    status,
  }: {
    type: string;
    slug: string;
    status: string;
  }) => void;
  onToggleWatchLater?: (bookmarkId: string) => Promise<unknown>;
};

export function BookmarksList({
  bookmarks,
  fosdemData,
  year,
  loading,
  day,
  view,
  tab = "events",
  headerActions,
  watchLaterItems,
  watchLaterLoading,
  onUpdateBookmark,
  showConflicts = true,
  scheduleShowConflictIndicators = true,
  defaultViewMode = "calendar",
  showViewMode = true,
  user,
  title,
  emptyStateTitle = "No bookmarks yet",
  emptyStateMessage = "Start bookmarking events to see them here.",
  onCreateBookmark,
  onToggleWatchLater,
}: BookmarksListProps) {
  const organizedBookmarks = useMemo(() => {
    if (!bookmarks || bookmarks.length === 0) return {};
    return organizeBookmarks(bookmarks);
  }, [bookmarks]);

  const bookmarkSnapshot = useMemo(
    () =>
      bookmarks?.map((bookmark) => ({
        slug: bookmark.slug,
        status: bookmark.status,
      })) || [],
    [bookmarks],
  );

  const eventCountByTrack = useMemo(() => {
    if (!fosdemData) return new Map<string, number>();
    const counts = new Map<string, number>();
    for (const event of Object.values(fosdemData.events)) {
      if (!isEvent(event) || !event.trackKey) continue;
      const key = event.trackKey.toString().trim().toLowerCase();
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return counts;
  }, [fosdemData]);

  const { tracks, events, conflicts } = useMemo(() => {
    if (!bookmarks?.length || !fosdemData) {
      return { tracks: [], events: [], conflicts: [] };
    }

    const bookmarkedEvents = organizedBookmarks[year]?.events || [];
    const bookmarkedTracks = organizedBookmarks[year]?.tracks || [];

    const formattedEvents = bookmarkedEvents
      .map((bookmark) => {
        const event = fosdemData.events[bookmark.slug];
        if (!event || !isEvent(event)) return null;
        return {
          ...event,
          priority: "priority" in bookmark ? bookmark.priority || null : null,
        } as Event;
      })
      .filter((event): event is NonNullable<typeof event> => event !== null)
      .sort(sortEvents);

    const conflicts = showConflicts ? detectEventConflicts(formattedEvents, year) : [];

    const formattedTracks = bookmarkedTracks
      .map((bookmark) => {
        const track = fosdemData.tracks[bookmark.slug];
        if (!track || !isTrack(track)) return null;

        const trackId = track.id?.toString().trim().toLowerCase() ?? "";
        const trackName = track.name?.toString().trim().toLowerCase() ?? "";
        const eventCount =
          eventCountByTrack.get(trackId) || eventCountByTrack.get(trackName) || 0;

        return {
          id: track.id,
          name: track.name,
          room: track.room,
          eventCount,
        } as Track;
      })
      .filter((track): track is NonNullable<typeof track> => track !== null)
      .sort(sortTracks);

    return { tracks: formattedTracks, events: formattedEvents, conflicts };
  }, [bookmarks, fosdemData, year, organizedBookmarks, showConflicts, eventCountByTrack]);

  const days = useMemo(
    () => (fosdemData ? Object.values(fosdemData.days) : []),
    [fosdemData],
  );

  const handleSetPriority = (eventId: string, updates: { priority: number | null }) => {
    const bookmark = bookmarks?.find((b) => {
      const event = fosdemData?.events[b.slug];
      return event?.id === eventId;
    });

    if (bookmark && onUpdateBookmark) {
      onUpdateBookmark({
        id: bookmark.id,
        serverId: bookmark.serverId,
        updates,
      });
    }
  };

  if (!bookmarks || bookmarks.length === 0) {
    return (
      <EmptyStateCard
        title={emptyStateTitle}
        description={emptyStateMessage}
        className="my-6"
      />
    );
  }

  if (tracks.length === 0 && events.length === 0) {
    return (
      <EmptyStateCard
        title={emptyStateTitle}
        description={emptyStateMessage}
        className="my-6"
      />
    );
  }

  return (
    <>
      {loading ? (
        <LoadingState type="spinner" message="Loading bookmarks..." variant="centered" />
      ) : bookmarks?.length ? (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-background/95 backdrop-blur-md p-1 text-muted-foreground md:w-auto border border-white/20 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-black/20">
              <Link
                to="."
                search={(prev) => ({ ...prev, tab: "all" })}
                className={cn(
                  tabBaseClass,
                  "hidden md:inline-flex",
                  tab === "all" ? tabActiveClass : tabInactiveClass,
                )}
              >
                All
              </Link>
              <Link
                to="."
                search={(prev) => ({ ...prev, tab: "events" })}
                className={cn(
                  tabBaseClass,
                  "flex-1",
                  tab === "events" ? tabActiveClass : tabInactiveClass,
                )}
              >
                Events
              </Link>
              <Link
                to="."
                search={(prev) => ({ ...prev, tab: "tracks" })}
                className={cn(
                  tabBaseClass,
                  "flex-1",
                  tab === "tracks" ? tabActiveClass : tabInactiveClass,
                )}
              >
                Tracks
              </Link>
              <Link
                to="."
                search={(prev) => ({ ...prev, tab: "watch-later" })}
                className={cn(
                  tabBaseClass,
                  "flex-1",
                  tab === "watch-later" ? tabActiveClass : tabInactiveClass,
                )}
              >
                Watch Later
              </Link>
            </div>
            {headerActions ? (
              <div className="flex w-full justify-end md:w-auto">{headerActions}</div>
            ) : null}
          </div>

          <div>
            {tracks.length > 0 && (
              <div
                className={cn({
                  hidden: tab === "events" || tab === "watch-later",
                  "pb-6": tab === "all",
                })}
              >
                <TrackList
                  tracks={tracks}
                  year={year}
                  title={title || "Bookmarked Tracks"}
                  day={day}
                  user={user}
                  onCreateBookmark={onCreateBookmark}
                  serverBookmarks={bookmarkSnapshot}
                />
              </div>
            )}

            {events.length > 0 && (
              <div
                className={cn(tab === "tracks" || tab === "watch-later" ? "hidden" : "")}
              >
                <EventList
                  events={events}
                  year={year}
                  conflicts={conflicts}
                  title={title || "Bookmarked Events"}
                  groupByDay={true}
                  days={days}
                  day={day}
                  view={view}
                  onSetPriority={handleSetPriority}
                  scheduleShowConflictIndicators={scheduleShowConflictIndicators}
                  showTrack={true}
                  defaultViewMode={defaultViewMode}
                  displayViewMode={showViewMode}
                  user={user}
                  onCreateBookmark={onCreateBookmark}
                  serverBookmarks={bookmarkSnapshot}
                  onToggleWatchLater={onToggleWatchLater}
                />
              </div>
            )}

            {tab === "watch-later" && (
              <div>
                <WatchLaterList
                  items={watchLaterItems || []}
                  fosdemData={fosdemData || null}
                  year={year}
                  loading={watchLaterLoading}
                  onToggleWatchLater={onToggleWatchLater || (async () => {})}
                  onMarkAsWatched={async () => {}}
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-2 mb-4">
          <p>You haven't bookmarked anything yet!</p>
        </div>
      )}
    </>
  );
}
