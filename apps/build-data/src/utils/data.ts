import type { Conference } from "../types";

export function flattenData<T>(element: unknown): T {
  if (Array.isArray(element)) {
    return element.map(flattenData) as T;
  }

  if (typeof element === "object" && element !== null) {
    const keys = Object.keys(element);

    if (keys.length === 1) {
      const key = keys[0];
      if (key === "value") {
        return (element as Record<string, T>)[key];
      }
    }

    const newElement = {} as T;
    for (const e of keys) {
      (newElement as Record<string, unknown>)[e] = flattenData(
        (element as Record<string, unknown>)[e]
      );
    }
    return newElement;
  }

  return element as T;
}

export function flattenConference(conference: any): Conference {
  const result: Conference = {
    acronym: conference.acronym?._text,
    title: conference.title?._text,
    subtitle: conference.subtitle?._text,
    venue: conference.venue?._text,
    city: conference.city?._text,
    start: conference.start?._text,
    end: conference.end?._text,
    days: [conference.start?._text, conference.end?._text].filter(Boolean),
    day_change: conference.day_change?._text,
    timeslot_duration: conference.timeslot_duration?._text,
    time_zone_name: conference.time_zone_name?._text,
  };

  return result;
}