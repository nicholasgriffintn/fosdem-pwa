import { xml2json } from "xml-js";

import type { Conference, Day, ProcessedEvent, Person, XmlPersonFull } from "../types";
import { flattenData, flattenConference } from "../utils/data";

export async function parseData(text: string): Promise<{
  conference: Conference;
  day: Day[];
  persons?: Person[];
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
  const result = flattenData<{ conference: any; day: Day[]; persons?: { person: XmlPersonFull[] | XmlPersonFull } }>(parsed.schedule);

  if (!result?.conference) {
    throw new Error("Invalid schedule: missing conference data");
  }

  const persons: Person[] = [];
  if (result.persons?.person) {
    const personArray = Array.isArray(result.persons.person)
      ? result.persons.person
      : [result.persons.person];

    for (const xmlPerson of personArray) {
      if (xmlPerson?._attributes?.id) {
        persons.push({
          id: xmlPerson._attributes.id,
          name: xmlPerson.name?._text || "",
          slug: xmlPerson.slug?._text || "",
          biography: xmlPerson.biography?._text,
          extended_biography: xmlPerson.extended_biography?._text,
        });
      }
    }
  }

  return {
    conference: flattenConference(result.conference),
    day: result.day,
    persons: persons.length > 0 ? persons : undefined,
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
