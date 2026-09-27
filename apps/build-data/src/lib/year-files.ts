import type { ConferenceConfig } from "@roomisfull/conference/types";
import { conferenceConfig } from "@roomisfull/conference";
import { getDataKey } from "@roomisfull/conference/paths";
import { createConferenceTemplate } from "./template";
import { createFosdemTemplate } from "../providers/fosdem/template";
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

export const createYearTemplate = (
	year: string,
	config: ConferenceConfig = conferenceConfig,
): BuildDataResult => {
	if (config.schedule.provider === "fosdem") return createFosdemTemplate(year);
	return createConferenceTemplate(config, year);
};

const getYearFiles = (
	data: BuildDataResult,
	year: string,
	config: ConferenceConfig,
): YearFile[] => {
	const files: YearFile[] = [
		{
			key: getDataKey(config, year),
			data,
			description: "full",
			pretty: true,
		},
		{
			key: getDataKey(config, year, "core"),
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
			key: getDataKey(config, year, "tracks"),
			data: { tracks: data.tracks, rooms: data.rooms },
			description: "tracks",
			pretty: false,
		},
		{
			key: getDataKey(config, year, "events"),
			data: { events: data.events },
			description: "events",
			pretty: false,
		},
		{
			key: getDataKey(config, year, "persons"),
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
	logger: Logger,
) => {
	const serialized = JSON.stringify(
		file.data,
		null,
		file.pretty ? 2 : undefined,
	);
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
	logger: Logger,
	config: ConferenceConfig = conferenceConfig,
) => {
	await Promise.all(
		getYearFiles(data, year, config).map((file) =>
			uploadYearFile(bucket, file, year, logger),
		),
	);
};

export const ensureYearFiles = async (
	bucket: YearFileBucket,
	year: string,
	logger: Logger,
	config: ConferenceConfig = conferenceConfig,
): Promise<BuildDataResult | null> => {
	const template = createYearTemplate(year, config);
	const files = getYearFiles(template, year, config);
	const existingFiles = await Promise.all(
		files.map((file) => bucket.head(file.key)),
	);
	const missingFiles = files.filter((_, index) => !existingFiles[index]);
	const fullFileWasMissing = !existingFiles[0];

	if (missingFiles.length === 0) {
		return null;
	}

	await Promise.all(
		missingFiles.map((file) => uploadYearFile(bucket, file, year, logger)),
	);

	logger.info("Created missing year files from template", {
		keys: missingFiles.map((file) => file.key),
	});

	return fullFileWasMissing ? template : null;
};
