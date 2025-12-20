import { constants } from "../constants";
import { createLogger } from "./logger";
import type {
  Conference,
  Day,
  ProcessedEvent,
  Link,
  Attachment,
  Stream,
  MutableDayInfo,
  MutableBuildDataResult,
  MutableBuildingStats,
  XmlEvent,
  XmlLink,
  XmlAttachment,
  BuildDataResult,
  Person,
} from "../types";
import { parseData, getRoomName, getLinkType, getStatus } from "./data";
import { slugify } from "../utils/slugs";

const typeData = Object.freeze(constants.TYPES);
const buildings = Object.freeze(constants.BUILDINGS);

class EventProcessor {
  private getType(event: XmlEvent): string {
    const type = event.type._text;
    const trackSlug = event.track._attributes?.slug;

    if (trackSlug === "dev-random") {
      return "lightningtalk";
    }

    if (type === "lightning") {
      return "lightningtalk";
    }

    if (type === "maintrack") {
      return "maintrack";
    }

    if (type === "lecture") {
      return "keynote";
    }

    if (type === "devroom") {
      return "devroom";
    }

    if (type === "workshop" || type === "bof") {
      return "other";
    }

    return type in typeData ? type : "other";
  }

  private processPersons(persons: XmlEvent["persons"]): {
    names: string[];
    ids: string[];
  } {
    if (!persons?.person) return { names: [], ids: [] };

    const personArray = Array.isArray(persons.person) ? persons.person : [persons.person];

    const names: string[] = [];
    const ids: string[] = [];

    for (const person of personArray) {
      const name = person._text || "";
      const id = person._attributes?.id;

      if (name) {
        names.push(name);
      }
      if (id) {
        ids.push(id);
      }
    }

    return { names, ids };
  }

  private processLinks(links: XmlEvent["links"]): Link[] {
    if (!links?.link) return [];
    const processLink = (link: XmlLink) => ({
      href: link._attributes.href,
      title: link._text || "",
      type: getLinkType(link._attributes.href),
    });

    return Array.isArray(links.link)
      ? links.link.map(processLink)
      : [processLink(links.link)];
  }

  private processAttachments(attachments: XmlEvent["attachments"]): Attachment[] {
    if (!attachments?.attachment) return [];
    const processAttachment = (attachment: XmlAttachment): Attachment => ({
      type: attachment._attributes.type,
      href: attachment._attributes.href,
      title: attachment._text || "",
    });

    return Array.isArray(attachments.attachment)
      ? attachments.attachment.map(processAttachment)
      : [processAttachment(attachments.attachment)];
  }

  private buildStreamInfo(roomName: string): Stream[] {
    const isLiveRoom = !["B.", "I.", "S."].some((prefix) => roomName.startsWith(prefix));

    if (!isLiveRoom) return [];

    const normalizedRoom = roomName.toLowerCase().replace(/\./g, "");
    return [
      {
        href: constants.STREAM_LINK.replace("${ROOM_ID}", normalizedRoom),
        title: "Stream",
        type: "application/vnd.apple.mpegurl",
      },
    ];
  }

  private buildChatInfo(roomName: string): string | null {
    return /^[A-Z]\./.test(roomName)
      ? constants.CHAT_LINK.replace("${ROOM_ID}", roomName.substring(2))
      : null;
  }

  private getTitle(title: string, status: ProcessedEvent["status"]): string {
    return status === "amendment" ? title?.substring(10) || title : title;
  }

  private getTrackKey(event: XmlEvent): string {
    const trackSlug = event.track._attributes?.slug;
    const trackName = event.track._text || "";
    return slugify(trackSlug ?? trackName);
  }

  public processEvent(
    event: XmlEvent,
    isLive: boolean,
    roomName: string,
    day: number,
    year: string
  ): ProcessedEvent | null {
    if (!event?.title?._text) return null;

    const title = event.title._text;
    const status = getStatus(title.toLowerCase());

    if (status === "canceled") return null;

    if (!event?.type?._text || !event?.track?._text) return null;

    const featuredEventIds = constants.KEYNOTES_BY_YEAR[year];
    const isFeatured = featuredEventIds?.includes(event._attributes.id);

    const type = this.getType(event);
    const track = event.track._text;
    const trackKey = this.getTrackKey(event);

    if (type === "other" && track === "stand") return null;

    const { names, ids } = this.processPersons(event.persons);

    return {
      day,
      isLive,
      status,
      type,
      track,
      trackKey,
      title: this.getTitle(title, status),
      persons: names,
      personIds: ids.length > 0 ? ids : undefined,
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
      description: event.description?._text,
      isFeatured
    };
  }
}

async function processScheduleData(
  data: {
    conference: Conference;
    day: Day[];
    persons?: Person[];
  },
  processor: EventProcessor,
  year: string
): Promise<BuildDataResult> {
  const result: MutableBuildDataResult = {
    conference: data.conference,
    types: {},
    buildings: {},
    days: {},
    rooms: {},
    tracks: {},
    events: {},
  };

  const persons: Record<string, Person> = {};
  if (data.persons) {
    for (const person of data.persons) {
      persons[person.id] = person;
    }
  }

  const getBuildingStats = (id: string | null): MutableBuildingStats | null => {
    if (!id) return null;
    if (!result.buildings[id]) {
      result.buildings[id] = {
        name: id,
        roomCount: 0,
        trackCount: 0,
        eventCount: 0,
        rooms: new Set(),
        tracks: new Set(),
      };
    }
    return result.buildings[id];
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
      buildings: new Set(),
    };
  }

  // Initialize buildings
  for (const building of Object.keys(buildings)) {
    result.buildings[building] = {
      name: building,
      roomCount: 0,
      trackCount: 0,
      eventCount: 0,
      rooms: new Set(),
      tracks: new Set(),
    };
  }

  // Process each day
  for (const day of data.day) {
    const dayIndex = day._attributes.index;
    const dayInfo: MutableDayInfo = {
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
      tracks: new Set(),
    };

    const rooms = Array.isArray(day.room) ? day.room : day.room ? [day.room] : [];
    if (rooms.length > 0) {
      // Process rooms in each day
      for (const room of rooms) {
        const roomName = getRoomName(room._attributes.name);
        const buildingMatch = roomName.match(/^(AW|[A-Z])/);
        const buildingId = buildingMatch ? buildingMatch[1] : null;
        const floorMatch = roomName.match(/^[A-Z]+\.?([0-9]+)/);
        const floor = floorMatch ? floorMatch[1] : null;
        const buildingStats = getBuildingStats(buildingId);

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

        buildingStats?.rooms.add(roomName);

        // Process events in each room
        const events = Array.isArray(room.event)
          ? room.event
          : room.event
            ? [room.event]
            : [];
        for (const xmlEvent of events) {
          const event = processor.processEvent(
            xmlEvent as XmlEvent,
            dayIndex === 1,
            roomName,
            dayIndex,
            year
          );

          if (event) {
            result.events[event.id] = event;
            result.rooms[roomName].eventCount++;
            dayInfo.eventCount++;
            if (buildingStats) {
              buildingStats.eventCount++;
              buildingStats.tracks.add(event.trackKey);
            }

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
            (track) => track.type === type.id
          ).length;
        }
      }
    }
  }

  const serializableTypes: BuildDataResult["types"] = {};
  for (const [key, type] of Object.entries(result.types)) {
    serializableTypes[key] = {
      id: type.id,
      name: type.name,
      trackCount: type.trackCount,
      eventCount: type.eventCount,
      roomCount: type.roomCount,
      buildingCount: type.buildingCount,
      rooms: Array.from(type.rooms),
      buildings: Array.from(type.buildings),
    };
  }

  const serializableDays: BuildDataResult["days"] = {};
  for (const [key, day] of Object.entries(result.days)) {
    serializableDays[key] = {
      date: day.date,
      start: day.start,
      end: day.end,
      id: day.id,
      name: day.name,
      eventCount: day.eventCount,
      trackCount: day.trackCount,
      roomCount: day.roomCount,
      buildingCount: day.buildingCount,
      rooms: Array.from(day.rooms),
      buildings: Array.from(day.buildings),
      tracks: Array.from(day.tracks),
    };
  }

  const serializableBuildings: BuildDataResult["buildings"] = {};
  for (const [key, building] of Object.entries(result.buildings)) {
    serializableBuildings[key] = {
      name: building.name,
      roomCount: building.rooms.size,
      trackCount: building.tracks.size,
      eventCount: building.eventCount,
    };
  }

  return {
    ...result,
    types: serializableTypes,
    days: serializableDays,
    buildings: serializableBuildings,
    persons: Object.keys(persons).length > 0 ? persons : undefined,
  };
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchScheduleWithRetry = async (
  url: string,
  logger?: ReturnType<typeof createLogger>
): Promise<Response> => {
  let lastError: unknown;

  for (let attempt = 0; attempt < constants.SCHEDULE_FETCH_MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      constants.SCHEDULE_FETCH_TIMEOUT_MS
    );

    try {
      logger?.info("Fetching schedule", { url, attempt: attempt + 1 });
      const response = await fetch(url, { signal: controller.signal });

      if (response.ok) {
        return response;
      }

      const isRetriableStatus = response.status >= 500 && response.status < 600;
      if (!isRetriableStatus) {
        throw new Error(
          `Failed to fetch schedule: ${response.status} ${response.statusText}`
        );
      }

      lastError = new Error(
        `Failed to fetch schedule: ${response.status} ${response.statusText}`
      );
      logger?.warn("Schedule fetch failed, will retry", {
        attempt: attempt + 1,
        status: response.status,
      });
    } catch (error) {
      const isAbort = (error as Error)?.name === "AbortError";
      lastError = isAbort ? new Error("Fetching schedule timed out") : error;
      const isLastAttempt = attempt === constants.SCHEDULE_FETCH_MAX_RETRIES - 1;

      logger?.error("Schedule fetch error", {
        attempt: attempt + 1,
        error: (error as Error)?.message,
        abort: (error as Error)?.name === "AbortError",
      });

      if (isLastAttempt) {
        throw lastError instanceof Error
          ? lastError
          : new Error("Unknown schedule fetch error");
      }
    } finally {
      clearTimeout(timeout);
    }

    await delay(constants.SCHEDULE_RETRY_BASE_DELAY_MS * (attempt + 1));
  }

  throw lastError instanceof Error ? lastError : new Error("Failed to fetch schedule");
};

const validateParsedSchedule = (data: { conference: Conference; day: Day[] }) => {
  if (!data?.conference) {
    throw new Error("Invalid schedule: missing conference data");
  }

  if (!Array.isArray(data.day) || data.day.length === 0) {
    throw new Error("Invalid schedule: missing day entries");
  }

  for (const day of data.day) {
    const rooms = Array.isArray(day.room) ? day.room : day.room ? [day.room] : [];
    if (rooms.length === 0) {
      throw new Error("Invalid schedule: missing rooms for day");
    }
  }
};

export async function buildData({ year }: { year: string }): Promise<BuildDataResult> {
  if (!year || !/^\d{4}$/.test(year)) {
    throw new Error("Invalid year format. Expected YYYY");
  }

  const logger = createLogger({ scope: "buildData", year });

  try {
    const url = constants.SCHEDULE_LINK.replace("${YEAR}", year);
    const response = await fetchScheduleWithRetry(url, logger);

    const text = await response.text();
    const data = await parseData(text);

    validateParsedSchedule(data);

    const processor = new EventProcessor();
    const result = await processScheduleData(data, processor, year);

    logger.info("Build data completed", {
      eventCount: Object.keys(result.events ?? {}).length,
      trackCount: Object.keys(result.tracks ?? {}).length,
    });

    return result;
  } catch (error) {
    logger.error("Error building data", { error: (error as Error)?.message });
    throw error;
  }
}
