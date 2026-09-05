import type { BuildDataResult } from "../types";
import { computeWeakEtag } from "../utils/hash";
import type { createLogger } from "./logger";

type Logger = Pick<ReturnType<typeof createLogger>, "info">;

interface YearFileBucket {
  head(key: string): Promise<unknown | null>;
  put(key: string, value: string, options?: R2PutOptions): Promise<unknown>;
}

interface YearFile {
  key: string;
  data: unknown;
  description: "full" | "core" | "tracks" | "events" | "persons";
  pretty: boolean;
}

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

const formatDate = (date: Date) => date.toISOString().slice(0, 10);

const getConferenceDates = (year: string) => {
  const firstOfFebruary = new Date(Date.UTC(Number(year), 1, 1));
  const daysUntilSaturday = 6 - firstOfFebruary.getUTCDay();
  const daysToClosestSaturday =
    daysUntilSaturday > 3 ? daysUntilSaturday - 7 : daysUntilSaturday;
  const firstDay = new Date(
    firstOfFebruary.getTime() + daysToClosestSaturday * DAY_IN_MILLISECONDS
  );
  const secondDay = new Date(firstDay.getTime() + DAY_IN_MILLISECONDS);
  const dayAfterConference = new Date(secondDay.getTime() + DAY_IN_MILLISECONDS);

  return {
    firstDay: formatDate(firstDay),
    secondDay: formatDate(secondDay),
    dayAfterConference: formatDate(dayAfterConference),
  };
};

export const createYearTemplate = (year: string): BuildDataResult => {
  const { firstDay, secondDay, dayAfterConference } = getConferenceDates(year);

  return {
    conference: {
      acronym: `fosdem-${year}`,
      title: `FOSDEM ${year}`,
      subtitle: "",
      venue: "ULB (Université Libre de Bruxelles)",
      city: "Brussels",
      start: firstDay,
      end: secondDay,
      days: [firstDay, secondDay],
      day_change: "09:00:00",
      timeslot_duration: "00:05:00",
      base_url: `https://fosdem.org/${year}/schedule/`,
      time_zone_name: "Europe/Brussels",
    },
    types: {},
    buildings: {},
    days: {
      "1": {
        date: firstDay,
        start: `${firstDay}T09:00:00+01:00`,
        end: `${secondDay}T08:59:00+01:00`,
        id: 1,
        name: "Day 1",
        eventCount: 0,
        trackCount: 0,
        roomCount: 0,
        buildingCount: 0,
        rooms: [],
        buildings: [],
        tracks: [],
      },
      "2": {
        date: secondDay,
        start: `${secondDay}T09:00:00+01:00`,
        end: `${dayAfterConference}T08:59:00+01:00`,
        id: 2,
        name: "Day 2",
        eventCount: 0,
        trackCount: 0,
        roomCount: 0,
        buildingCount: 0,
        rooms: [],
        buildings: [],
        tracks: [],
      },
    },
    rooms: {},
    tracks: {},
    events: {},
  };
};

const getYearFiles = (data: BuildDataResult, year: string): YearFile[] => {
  const files: YearFile[] = [
    {
      key: `fosdem-${year}.json`,
      data,
      description: "full",
      pretty: true,
    },
    {
      key: `fosdem-${year}-core.json`,
      data: {
        conference: data.conference,
        days: data.days,
        types: data.types,
        buildings: data.buildings,
      },
      description: "core",
      pretty: false,
    },
    {
      key: `fosdem-${year}-tracks.json`,
      data: { tracks: data.tracks, rooms: data.rooms },
      description: "tracks",
      pretty: false,
    },
    {
      key: `fosdem-${year}-events.json`,
      data: { events: data.events },
      description: "events",
      pretty: false,
    },
    {
      key: `fosdem-${year}-persons.json`,
      data: { persons: data.persons ?? {} },
      description: "persons",
      pretty: false,
    },
  ];

  return files;
};

const uploadYearFile = async (
  bucket: YearFileBucket,
  file: YearFile,
  year: string,
  logger: Logger
) => {
  const serialized = JSON.stringify(file.data, null, file.pretty ? 2 : undefined);
  const etag = await computeWeakEtag(serialized);

  await bucket.put(file.key, serialized, {
    httpMetadata: {
      contentType: "application/json",
      cacheControl: "public, max-age=600",
    },
    customMetadata: {
      year,
      etag,
      type: file.description,
    },
  });

  logger.info("Uploaded year file to R2", {
    key: file.key,
    type: file.description,
    size: serialized.length,
    etag,
  });
};

export const uploadYearFiles = async (
  bucket: YearFileBucket,
  data: BuildDataResult,
  year: string,
  logger: Logger
) => {
  await Promise.all(
    getYearFiles(data, year).map((file) => uploadYearFile(bucket, file, year, logger))
  );
};

export const ensureYearFiles = async (
  bucket: YearFileBucket,
  year: string,
  logger: Logger
): Promise<BuildDataResult | null> => {
  const template = createYearTemplate(year);
  const files = getYearFiles(template, year);
  const existingFiles = await Promise.all(files.map((file) => bucket.head(file.key)));
  const missingFiles = files.filter((_, index) => !existingFiles[index]);
  const fullFileWasMissing = !existingFiles[0];

  if (missingFiles.length === 0) {
    return null;
  }

  await Promise.all(
    missingFiles.map((file) => uploadYearFile(bucket, file, year, logger))
  );

  logger.info("Created missing year files from template", {
    keys: missingFiles.map((file) => file.key),
  });

  return fullFileWasMissing ? template : null;
};
