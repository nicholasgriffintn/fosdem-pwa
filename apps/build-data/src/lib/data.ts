import { xml2json } from "xml-js";

import type { Conference, Day, ProcessedEvent } from "../types";
import { flattenData, flattenConference } from "../utils/data";

export async function parseData(text: string): Promise<{
  conference: Conference;
  day: Day[];
}> {
  const data = await xml2json(text, {
    compact: true,
    ignoreDeclaration: true,
    ignoreInstruction: true,
    ignoreComment: true,
    ignoreDoctype: true,
    ignoreCdata: true,
    textFn: (value) => value.trim(),
  });

  const parsed = JSON.parse(data);
  const result = flattenData<{ conference: any; day: Day[] }>(parsed.schedule);

  if (!result?.conference) {
    throw new Error("Invalid schedule: missing conference data");
  }

  return {
    conference: flattenConference(result.conference),
    day: result.day,
  };
}

const memoize = <T, R>(fn: (arg: T) => R) => {
  const cache = new Map<T, R>();
  return (arg: T): R => {
    const value = cache.get(arg) ?? fn(arg);
    cache.set(arg, value);
    return value;
  };
};

export const getRoomName = memoize((name: string) =>
  name.startsWith("D.") ? `${name} (online)` : name
);

export const getLinkType = memoize((url: string) => {
  if (url.endsWith(".mp4")) return "video/mp4";
  if (url.endsWith(".webm")) return "video/webm";
  return null;
});

export const getStatus = memoize((title: string): ProcessedEvent["status"] => {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes("canceled")) return "canceled";
  if (lowerTitle.includes("amendment")) return "amendment";
  return "running";
});
