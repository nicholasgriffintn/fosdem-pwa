import { constants } from "./constants";

export interface XmlAttribute {
  _attributes: Record<string, string>;
  _text?: string;
}

export interface XmlEvent extends XmlAttribute {
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

export interface XmlLink extends XmlAttribute {
  _attributes: {
    href: string;
  };
}

export interface XmlAttachment extends XmlLink {
  _attributes: {
    href: string;
    type: string;
  };
}

// Processed data interfaces
export interface Conference {
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

export interface BuildingStats {
  name: string;
  roomCount: number;
  trackCount: number;
  eventCount: number;
}

export interface ProcessedEvent {
  day: number;
  isLive: boolean;
  status: "canceled" | "amendment" | "running" | "unknown";
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

export interface Link {
  href: string;
  title: string;
  type: string | null;
}

export interface Attachment {
  type: string;
  href: string;
  title: string;
}

export interface Stream {
  href: string;
  title: string;
  type: string;
}

export interface BuildDataResult {
  conference: Conference;
  types: Record<string, TypeInfo>;
  buildings: Record<string, BuildingStats>;
  days: Record<string, DayInfo>;
  rooms: Record<string, RoomInfo>;
  tracks: Record<string, TrackInfo>;
  events: Record<string, ProcessedEvent>;
}

export interface TypeInfo {
  id: string;
  name: string;
  trackCount: number;
  eventCount: number;
  roomCount: number;
  buildingCount: number;
  rooms: string[];
  buildings: string[];
}

export interface DayInfo {
  date: string;
  start: string;
  end: string;
  id: number;
  name: string;
  eventCount: number;
  trackCount: number;
  roomCount: number;
  buildingCount: number;
  rooms: string[];
  buildings: string[];
  tracks: string[];
}

export interface RoomInfo {
  name: string;
  slug: string;
  buildingId: string | null;
  building: (typeof constants.BUILDINGS)[keyof typeof constants.BUILDINGS] | null;
  floor: string | null;
  eventCount: number;
}

export interface TrackInfo {
  id: string;
  name: string;
  type: string;
  room: string;
  day: number[];
  eventCount: number;
}

export type MutableTypeInfo = Omit<TypeInfo, "rooms" | "buildings"> & {
  rooms: Set<string>;
  buildings: Set<string>;
};

export type MutableDayInfo = Omit<DayInfo, "rooms" | "buildings" | "tracks"> & {
  rooms: Set<string>;
  buildings: Set<string>;
  tracks: Set<string>;
};

export type MutableBuildDataResult = Omit<BuildDataResult, "types" | "days"> & {
  types: Record<string, MutableTypeInfo>;
  days: Record<string, MutableDayInfo>;
};

export type RoomEvent = {
  _attributes: {
    guid: string;
    id: string;
  };
};

export type Room = {
  _attributes: { name: string; slug: string };
  event: RoomEvent | RoomEvent[];
};

export type Day = {
  _attributes: { index: number; date: string; start: string; end: string };
  room: Room[];
};