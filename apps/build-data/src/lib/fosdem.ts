import { xml2json } from 'xml-js';

import { constants } from '../constants';

// Base interfaces for XML parsing
interface XmlAttribute {
  _attributes: Record<string, string>;
  _text?: string;
}

interface XmlEvent extends XmlAttribute {
  _attributes: {
    guid: string;
    id: string;
  };
  title: { _text: string };
  type: { _text: string };
  track: { _text: string };
  persons?: { person: Array<{ _text: string }> | { _text: string } };
  links?: { link: Array<XmlLink> | XmlLink };
  attachments?: { attachment: Array<XmlAttachment> | XmlAttachment };
  url?: { _text: string };
  language?: { _text: string };
  feedback_url?: { _text: string };
  start: { _text: string };
  duration: { _text: string };
  subtitle?: { _text: string };
  abstract?: { _text: string };
  description?: { _text: string };
}

interface XmlLink extends XmlAttribute {
  _attributes: {
    href: string;
  };
}

interface XmlAttachment extends XmlLink {
  _attributes: {
    href: string;
    type: string;
  };
}

// Processed data interfaces
interface Conference {
  acronym?: string;
  title?: string;
  subtitle?: string;
  venue?: string;
  city?: string;
  start?: string;
  end?: string;
  days: string[];
  day_change?: string;
  timeslot_duration?: string;
  time_zone_name?: string;
}

interface BuildingStats {
  name: string;
  roomCount: number;
  trackCount: number;
  eventCount: number;
}

interface ProcessedEvent {
  day: number;
  isLive: boolean;
  status: 'canceled' | 'amendment' | 'running' | 'unknown';
  type: string;
  track: string;
  trackKey: string;
  title: string;
  persons: string[];
  links: Link[];
  attachments: Attachment[];
  streams: Stream[];
  chat: string | null;
  room: string;
  url?: string;
  language?: string;
  feedbackUrl?: string;
  id: string;
  startTime: string;
  duration: string;
  subtitle?: string;
  abstract?: string;
  description?: string;
}

interface Link {
  href: string;
  title: string;
  type: string | null;
}

interface Attachment {
  type: string;
  href: string;
  title: string;
}

interface Stream {
  href: string;
  title: string;
  type: string;
}

interface BuildDataResult {
  conference: Conference;
  types: Record<string, TypeInfo>;
  buildings: Record<string, BuildingStats>;
  days: Record<string, DayInfo>;
  rooms: Record<string, RoomInfo>;
  tracks: Record<string, TrackInfo>;
  events: Record<string, ProcessedEvent>;
}

interface TypeInfo {
  id: string;
  name: string;
  trackCount: number;
  eventCount: number;
  roomCount: number;
  buildingCount: number;
  rooms: Set<string>;
  buildings: Set<string>;
}

interface DayInfo {
  date: string;
  start: string;
  end: string;
  id: number;
  name: string;
  eventCount: number;
  trackCount: number;
  roomCount: number;
  buildingCount: number;
  rooms: Set<string>;
  buildings: Set<string>;
  tracks: Set<string>;
}

interface RoomInfo {
  name: string;
  slug: string;
  buildingId: string | null;
  building: (typeof buildings)[keyof typeof buildings] | null;
  floor: string | null;
  eventCount: number;
}

interface TrackInfo {
  id: string;
  name: string;
  type: string;
  room: string;
  day: number[];
  eventCount: number;
}

type RoomEvent = {
  _attributes: {
    guid: string;
    id: string;
  };
};

type Room = {
  _attributes: { name: string; slug: string };
  event: RoomEvent | RoomEvent[];
};

type Day = {
  _attributes: { index: number; date: string; start: string; end: string };
  room: Room[];
};

const typeData = Object.freeze(constants.TYPES);
const buildings = Object.freeze(constants.BUILDINGS);

function flattenData<T>(element: unknown): T {
  if (Array.isArray(element)) {
    return element.map(flattenData) as T;
  }

  if (typeof element === 'object' && element !== null) {
    const keys = Object.keys(element);

    if (keys.length === 1) {
      const key = keys[0];
      if (key === 'value') {
        return (element as Record<string, T>)[key];
      }
    }

    const newElement = {} as T;
    for (const e of keys) {
      (newElement as Record<string, unknown>)[e] = flattenData((element as Record<string, unknown>)[e]);
    }
    return newElement;
  }

  return element as T;
}

function flattenConference(conference: any): Conference {
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
    time_zone_name: conference.time_zone_name?._text
  };

  return result;
}

async function parseData(text: string): Promise<{
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

  return {
    conference: flattenConference(result.conference),
    day: result.day
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

const getRoomName = memoize((name: string) =>
  name.startsWith('D.') ? `${name} (online)` : name
);

const getLinkType = memoize((url: string) => {
  if (url.endsWith('.mp4')) return 'video/mp4';
  if (url.endsWith('.webm')) return 'video/webm';
  return null;
});

const getStatus = memoize((title: string): ProcessedEvent['status'] => {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('canceled')) return 'canceled';
  if (lowerTitle.includes('amendment')) return 'amendment';
  return 'running';
});

class EventProcessor {
  private getType(event: XmlEvent): string {
    const type = event.type._text;
    if (type === 'lightning') {
      return 'lightningtalk';
    }

    if (type === 'lecture') {
      return 'keynote';
    }

    return type in typeData ? type : 'other';
  }

  private processPersons(persons: XmlEvent['persons']): string[] {
    if (!persons?.person) return [];
    return Array.isArray(persons.person)
      ? persons.person.map(person => person._text)
      : [persons.person._text];
  }

  private processLinks(links: XmlEvent['links']): Link[] {
    if (!links?.link) return [];
    const processLink = (link: XmlLink) => ({
      href: link._attributes.href,
      title: link._text || '',
      type: getLinkType(link._attributes.href)
    });

    return Array.isArray(links.link)
      ? links.link.map(processLink)
      : [processLink(links.link)];
  }

  private processAttachments(attachments: XmlEvent['attachments']): Attachment[] {
    if (!attachments?.attachment) return [];
    const processAttachment = (attachment: XmlAttachment): Attachment => ({
      type: attachment._attributes.type,
      href: attachment._attributes.href,
      title: attachment._text || ''
    });

    return Array.isArray(attachments.attachment)
      ? attachments.attachment.map(processAttachment)
      : [processAttachment(attachments.attachment)];
  }

  private buildStreamInfo(roomName: string): Stream[] {
    const isLiveRoom = !['B.', 'I.', 'S.'].some(prefix =>
      roomName.startsWith(prefix)
    );

    if (!isLiveRoom) return [];

    const normalizedRoom = roomName.toLowerCase().replace(/\./g, '');
    return [{
      href: constants.STREAM_LINK.replace('${ROOM_ID}', normalizedRoom),
      title: 'Stream',
      type: 'application/vnd.apple.mpegurl'
    }];
  }

  private buildChatInfo(roomName: string): string | null {
    return /^[A-Z]\./.test(roomName)
      ? constants.CHAT_LINK.replace('${ROOM_ID}', roomName.substring(2))
      : null;
  }

  private getTitle(title: string, status: ProcessedEvent['status']): string {
    return status === 'amendment' ? title?.substring(10) || title : title;
  }

  public processEvent(
    event: XmlEvent,
    isLive: boolean,
    roomName: string,
    day: number
  ): ProcessedEvent | null {
    if (!event?.title?._text) return null;

    const title = event.title._text;
    const status = getStatus(title.toLowerCase());

    if (status === 'canceled') return null;

    if (!event?.type?._text || !event?.track?._text) return null;

    const type = this.getType(event);
    const track = event.track._text;
    const trackKey = track.toLowerCase().replace(/\s/g, '');

    if (type === 'other' && track === 'stand') return null;

    return {
      day,
      isLive,
      status,
      type,
      track,
      trackKey,
      title: this.getTitle(title, status),
      persons: this.processPersons(event.persons),
      links: this.processLinks(event.links),
      attachments: this.processAttachments(event.attachments),
      streams: this.buildStreamInfo(roomName),
      chat: this.buildChatInfo(roomName),
      room: roomName,
      url: event.url?._text,
      language: event.language?._text,
      feedbackUrl: event.feedback_url?._text,
      id: event._attributes.id,
      startTime: event.start._text,
      duration: event.duration._text,
      subtitle: event.subtitle?._text,
      abstract: event.abstract?._text,
      description: event.description?._text
    };
  }
}

async function processScheduleData(
  data: {
    conference: Conference;
    day: Day[];
  },
  processor: EventProcessor
): Promise<BuildDataResult> {
  const result: BuildDataResult = {
    conference: data.conference,
    types: {},
    buildings: {},
    days: {},
    rooms: {},
    tracks: {},
    events: {}
  };

  // Initialize types from constants
  for (const type of Object.keys(typeData)) {
    result.types[type] = {
      id: type,
      name: typeData[type as keyof typeof typeData].name,
      trackCount: 0,
      eventCount: 0,
      roomCount: 0,
      buildingCount: 0,
      rooms: new Set(),
      buildings: new Set()
    };
  }

  // Initialize buildings
  for (const building of Object.keys(buildings)) {
    result.buildings[building] = {
      name: building,
      roomCount: 0,
      trackCount: 0,
      eventCount: 0
    };
  }

  // Process each day
  for (const day of data.day) {
    const dayIndex = day._attributes.index;
    const dayInfo: DayInfo = {
      date: day._attributes.date,
      start: day._attributes.start,
      end: day._attributes.end,
      id: dayIndex,
      name: `Day ${dayIndex}`,
      eventCount: 0,
      trackCount: 0,
      roomCount: 0,
      buildingCount: 0,
      rooms: new Set(),
      buildings: new Set(),
      tracks: new Set()
    };

    if (day.room?.length > 0) {
      // Process rooms in each day
      for (const room of day.room) {
        const roomName = getRoomName(room._attributes.name);
        const buildingMatch = roomName.match(/^(AW|[A-Z])/);
        const buildingId = buildingMatch ? buildingMatch[1] : null;
        const floorMatch = roomName.match(/^[A-Z]+\.?([0-9]+)/);
        const floor = floorMatch ? floorMatch[1] : null;

        if (!result.rooms[roomName]) {
          result.rooms[roomName] = {
            name: roomName,
            slug: room._attributes.slug,
            buildingId,
            building:
              buildingId && buildingId in buildings
                ? buildings[buildingId as keyof typeof buildings]
                : null,
            floor,
            eventCount: 0,
          };
        }

        // Process events in each room
        const events = Array.isArray(room.event)
          ? room.event
          : [room.event];
        for (const xmlEvent of events) {
          const event = processor.processEvent(
            xmlEvent as XmlEvent,
            dayIndex === 1,
            roomName,
            dayIndex,
          );

          if (event) {
            result.events[event.id] = event;
            result.rooms[roomName].eventCount++;
            dayInfo.eventCount++;

            // Update track info
            if (!result.tracks[event.trackKey]) {
              result.tracks[event.trackKey] = {
                id: event.trackKey,
                name: event.track,
                type: event.type,
                room: roomName,
                day: [dayIndex],
                eventCount: 0,
              };
            } else {
              if (!result.tracks[event.trackKey].day.includes(dayIndex)) {
                result.tracks[event.trackKey].day.push(dayIndex);
              }
            }
            result.tracks[event.trackKey].eventCount++;

            // Update type stats
            if (result.types[event.type]) {
              result.types[event.type].eventCount++;
              result.types[event.type].rooms.add(roomName);
              if (buildingId) {
                result.types[event.type].buildings.add(buildingId);
              }
            }

            // Update day stats
            dayInfo.rooms.add(roomName);
            if (buildingId) {
              dayInfo.buildings.add(buildingId);
            }
            dayInfo.tracks.add(event.trackKey);
          }
        }

        // Update building stats
        if (buildingId && result.buildings[buildingId]) {
          result.buildings[buildingId].roomCount++;
          result.buildings[buildingId].eventCount +=
            result.rooms[roomName].eventCount;
        }
      }
    }

    // Update final day stats
    dayInfo.roomCount = dayInfo.rooms.size;
    dayInfo.buildingCount = dayInfo.buildings.size;
    dayInfo.trackCount = dayInfo.tracks.size;
    result.days[dayIndex] = dayInfo;

    if (Object.keys(result.types)?.length > 0) {
      // Update type stats
      for (const type of Object.values(result.types)) {
        type.roomCount = type.rooms.size;
        type.buildingCount = type.buildings.size;
        if (Object.keys(result.tracks)?.length > 0) {
          type.trackCount = Object.values(result.tracks).filter(
            (track) => track.type === type.id,
          ).length;
        }
      }
    }
  }

  if (Object.keys(result.types).length > 0) {
    // Clean up before returning
    for (const type of Object.values(result.types)) {
      // biome-ignore lint/performance/noDelete: <explanation>
      delete (type as any).rooms;
      // biome-ignore lint/performance/noDelete: <explanation>
      delete (type as any).buildings;
    }
  }

  if (Object.keys(result.days).length > 0) {
    for (const day of Object.values(result.days)) {
      // biome-ignore lint/performance/noDelete: <explanation>
      delete (day as any).rooms;
      // biome-ignore lint/performance/noDelete: <explanation>
      delete (day as any).buildings;
      // biome-ignore lint/performance/noDelete: <explanation>
      delete (day as any).tracks;
    }
  }

  return result;
}

export async function buildData({ year }: { year: string }): Promise<BuildDataResult> {
  if (!year || !/^\d{4}$/.test(year)) {
    throw new Error('Invalid year format. Expected YYYY');
  }

  try {
    const url = constants.SCHEDULE_LINK.replace('${YEAR}', year);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch schedule: ${response.statusText}`);
    }

    const text = await response.text();
    const data = await parseData(text);

    const processor = new EventProcessor();
    const result = await processScheduleData(data, processor);

    return result;
  } catch (error) {
    console.error('Error building data:', error);
    throw error;
  }
}
