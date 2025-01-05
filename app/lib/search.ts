import type { FuseResult, FuseOptionKey } from "fuse.js";
import Fuse from "fuse.js";

import type { Event, Track, RoomData } from "~/types/fosdem";

export interface SearchResult {
  type: "type" | "track" | "event" | "room";
  item: any;
  score?: number;
}

export interface SearchResults {
  tracks: Track[];
  events: Event[];
  rooms: RoomData[];
}

const COMMON_FUSE_OPTIONS = {
  threshold: 0.4,
  includeScore: true,
  useExtendedSearch: true,
  ignoreLocation: true,
  getFn: (obj: any, path: string | string[]) => {
    const value = Fuse.config.getFn(obj, path);
    return value ? String(value) : "";
  }
};

export const TRACK_SEARCH_KEYS = [
  { name: "name", weight: 1.0 },
  { name: "type", weight: 0.8 },
  { name: "description", weight: 0.6 },
  { name: "room", weight: 0.4 }
];

export const EVENT_SEARCH_KEYS = [
  { name: "title", weight: 1.0 },
  { name: "persons", weight: 0.9 },
  { name: "track", weight: 0.8 },
  { name: "abstract", weight: 0.7 },
  { name: "description", weight: 0.6 },
  { name: "room", weight: 0.4 }
];

export const ROOM_SEARCH_KEYS = [
  { name: "name", weight: 1.0 },
  { name: "slug", weight: 0.8 },
  { name: "buildingId", weight: 0.6 }
];

export function createSearchIndex<T>(items: T[], keys: FuseOptionKey<T>[]) {
  return new Fuse(items, {
    ...COMMON_FUSE_OPTIONS,
    keys
  });
}

export function formatSearchResults<T>(results: FuseResult<T>[], type: SearchResult["type"], limit: number): SearchResult[] {
  return results
    .sort((a, b) => (a.score || 0) - (b.score || 0))
    .slice(0, limit)
    .map((result) => ({
      type,
      item: result.item,
      score: result.score
    }));
}

export function formatTrack(track: Track, fosdemEvents: Record<string, Event>): Track {
  return {
    id: track.id,
    name: track.name,
    room: track.room,
    eventCount: Object.values(fosdemEvents || {}).filter(
      (event) => event.trackKey === track.name,
    ).length,
  } as Track;
}

export function formatEvent(event: Event): Event {
  return {
    id: event.id,
    title: event.title,
    startTime: event.startTime,
    duration: event.duration,
    room: event.room,
    persons: event.persons,
  } as Event;
}

export function formatRoom(room: RoomData): RoomData {
  return {
    name: room.name,
    slug: room.slug,
    buildingId: room.buildingId || room.building?.id,
    eventCount: room.eventCount,
  };
} 