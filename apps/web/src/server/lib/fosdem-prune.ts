import type { Conference } from "~/types/fosdem";
import type { Bookmark } from "~/server/db/schema";

const EVENT_TYPES = new Set(["bookmark_event", "event"]);
const TRACK_TYPES = new Set(["bookmark_track", "track"]);

const toDayIds = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((day) => String(day));
  }
  if (value === null || value === undefined) {
    return [];
  }
  return [String(value)];
};

export const pruneFosdemData = (
  data: Conference,
  bookmarks: Bookmark[],
): Conference => {
  if (!bookmarks.length) {
    return {
      conference: data.conference,
      types: {},
      buildings: {},
      rooms: {},
      days: {},
      tracks: {},
      events: {},
    };
  }

  const eventSlugs = new Set<string>();
  const trackSlugs = new Set<string>();

  for (const bookmark of bookmarks) {
    if (EVENT_TYPES.has(bookmark.type)) {
      eventSlugs.add(bookmark.slug);
    } else if (TRACK_TYPES.has(bookmark.type)) {
      trackSlugs.add(bookmark.slug);
    }
  }

  const events: Conference["events"] = {};
  const tracks: Conference["tracks"] = {};
  const days: Conference["days"] = {};

  const addDay = (dayId: string) => {
    const day = data.days[dayId];
    if (day) {
      days[dayId] = day;
    }
  };

  for (const slug of eventSlugs) {
    const event = data.events[slug];
    if (!event) continue;
    events[slug] = event;
    for (const dayId of toDayIds(event.day)) {
      addDay(dayId);
    }
  }

  for (const slug of trackSlugs) {
    const track = data.tracks[slug];
    if (!track) continue;
    tracks[slug] = track;
    addDay(String(track.day));
  }

  return {
    conference: data.conference,
    types: {},
    buildings: {},
    rooms: {},
    days,
    tracks,
    events,
  };
};
