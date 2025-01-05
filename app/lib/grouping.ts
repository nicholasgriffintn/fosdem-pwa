import type { DayGroupedData, Event, Track } from "~/types/fosdem";

/**
 * Generic function to group items by day
 */
export function groupByDay<T>(
  items: T[],
  getDayFn: (item: T) => string | number | string[] | number[],
): DayGroupedData {
  return items.reduce((acc: DayGroupedData, item) => {
    const dayValue = getDayFn(item);
    const days = Array.isArray(dayValue) ? dayValue : [String(dayValue)];

    for (const day of days) {
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push(item);
    }

    return acc;
  }, {});
}

/**
 * Helper function to group events by day
 */
export function groupEventsByDay(events: Event[]): DayGroupedData {
  return groupByDay(events, (event) => event.day);
}

/**
 * Helper function to group tracks by day
 */
export function groupTracksByDay(tracks: Track[]): DayGroupedData {
  return groupByDay(tracks, (track) => track.day);
} 