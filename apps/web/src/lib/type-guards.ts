import type { Event, Track } from "~/types/fosdem";
import type { Bookmark } from "~/server/db/schema";

export type BookmarkSnapshot = Pick<Bookmark, "slug" | "status"> & {
  id?: string;
  watch_later?: boolean | null;
};

export interface ItemWithId {
  id: string;
}

export function isEvent(item: Event | Track): item is Event {
  return 'title' in item && 'startTime' in item;
}

export function isTrack(item: Event | Track): item is Track {
  return 'name' in item && 'eventCount' in item;
}

export function hasBookmark<T extends ItemWithId>(
  item: T,
  bookmarks: BookmarkSnapshot[]
): boolean {
  return bookmarks.some(
    (bookmark) => bookmark.slug === item.id && bookmark.status === 'favourited'
  );
}

export function isValidYear(year: unknown): year is number {
  return typeof year === 'number' && year >= 2000 && year <= 2100;
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number';
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

export function isValidNote(note: unknown): note is { year: number; slug: string; note: string } {
  return (
    note !== null &&
    note !== undefined &&
    typeof note === 'object' &&
    'year' in note &&
    'slug' in note &&
    'note' in note &&
    typeof note.year === 'number' &&
    !Number.isNaN(note.year) &&
    typeof note.slug === 'string' &&
    note.slug.length > 0 &&
    typeof note.note === 'string'
  );
}

export function isValidServerNote(note: unknown): note is { id: number; year: number; slug: string } {
  return (
    note !== null &&
    note !== undefined &&
    typeof note === 'object' &&
    'id' in note &&
    'year' in note &&
    'slug' in note &&
    typeof note.id === 'number' &&
    typeof note.year === 'number' &&
    typeof note.slug === 'string' &&
    note.slug.length > 0
  );
}

export function isFavourited(bookmark: BookmarkSnapshot | { status: string }): boolean {
  return bookmark.status === 'favourited';
}

export function hasId(value: unknown): value is { id: number } {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof (value as { id: unknown }).id === "number"
  );
}
