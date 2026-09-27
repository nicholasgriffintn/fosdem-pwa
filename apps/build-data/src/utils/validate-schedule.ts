import {
	isRecord,
	isRecordOf,
	isStringArray,
	hasOptionalStrings,
	isWebUrl,
} from "@roomisfull/conference/utils/guards";
import type {
	BuildDataResult,
	Conference,
	ProcessedEvent,
	TrackInfo,
	RoomInfo,
	DayInfo,
	TypeInfo,
	BuildingStats,
	Person,
	Link,
	Attachment,
	Stream,
} from "../types";

function isLink(value: unknown): value is Link {
	return (
		isRecord(value) &&
		isWebUrl(value.href) &&
		typeof value.title === "string" &&
		(value.type === null || typeof value.type === "string")
	);
}

function isAttachment(value: unknown): value is Attachment & Stream {
	return isLink(value) && typeof value.type === "string";
}

function isConference(value: unknown): value is Conference {
	return (
		isRecord(value) &&
		typeof value.title === "string" &&
		typeof value.start === "string" &&
		typeof value.end === "string" &&
		typeof value.time_zone_name === "string" &&
		isStringArray(value.days) &&
		hasOptionalStrings(value, [
			"acronym",
			"subtitle",
			"venue",
			"city",
			"day_change",
			"timeslot_duration",
			"base_url",
		])
	);
}

function isEvent(value: unknown): value is ProcessedEvent {
	if (!isRecord(value)) return false;
	return (
		[
			"id",
			"title",
			"type",
			"track",
			"trackKey",
			"room",
			"startTime",
			"duration",
		].every((key) => typeof value[key] === "string") &&
		typeof value.day === "number" &&
		Number.isInteger(value.day) &&
		typeof value.isLive === "boolean" &&
		["canceled", "amendment", "running", "unknown"].includes(
			String(value.status),
		) &&
		isStringArray(value.persons) &&
		(value.personIds === undefined || isStringArray(value.personIds)) &&
		(value.chat === null || isWebUrl(value.chat)) &&
		[value.url, value.feedbackUrl].every(
			(url) => url === undefined || url === "" || isWebUrl(url),
		) &&
		hasOptionalStrings(value, [
			"language",
			"subtitle",
			"abstract",
			"description",
		]) &&
		(value.isFeatured === undefined || typeof value.isFeatured === "boolean") &&
		Array.isArray(value.links) &&
		value.links.every(isLink) &&
		Array.isArray(value.attachments) &&
		value.attachments.every(isAttachment) &&
		Array.isArray(value.streams) &&
		value.streams.every(isAttachment)
	);
}

function isTrack(value: unknown): value is TrackInfo {
	return (
		isRecord(value) &&
		["id", "name", "type", "room"].every(
			(key) => typeof value[key] === "string",
		) &&
		Array.isArray(value.day) &&
		value.day.every((day) => Number.isInteger(day)) &&
		typeof value.eventCount === "number"
	);
}

function isRoom(value: unknown): value is RoomInfo {
	return (
		isRecord(value) &&
		typeof value.name === "string" &&
		typeof value.slug === "string" &&
		typeof value.eventCount === "number" &&
		(value.buildingId === null || typeof value.buildingId === "string") &&
		(value.building === null ||
			(isRecord(value.building) && typeof value.building.id === "string")) &&
		(value.floor === null || typeof value.floor === "string")
	);
}

function isDay(value: unknown): value is DayInfo {
	return (
		isRecord(value) &&
		["date", "start", "end", "name"].every(
			(key) => typeof value[key] === "string",
		) &&
		["id", "eventCount", "trackCount", "roomCount", "buildingCount"].every(
			(key) => typeof value[key] === "number",
		) &&
		isStringArray(value.rooms) &&
		isStringArray(value.buildings) &&
		isStringArray(value.tracks)
	);
}

function isType(value: unknown): value is TypeInfo {
	return (
		isRecord(value) &&
		typeof value.id === "string" &&
		typeof value.name === "string" &&
		["eventCount", "trackCount", "roomCount", "buildingCount"].every(
			(key) => typeof value[key] === "number",
		) &&
		isStringArray(value.rooms) &&
		isStringArray(value.buildings)
	);
}

function isBuilding(value: unknown): value is BuildingStats {
	return (
		isRecord(value) &&
		typeof value.name === "string" &&
		["eventCount", "trackCount", "roomCount"].every(
			(key) => typeof value[key] === "number",
		)
	);
}

function isPerson(value: unknown): value is Person {
	return (
		isRecord(value) &&
		["id", "name", "slug"].every((key) => typeof value[key] === "string") &&
		hasOptionalStrings(value, ["biography", "extended_biography"])
	);
}

export function validateSchedule(
	data: unknown,
): asserts data is BuildDataResult {
	if (
		!isRecord(data) ||
		!isConference(data.conference) ||
		!isRecordOf(data.events, isEvent) ||
		!isRecordOf(data.tracks, isTrack) ||
		!isRecordOf(data.rooms, isRoom) ||
		!isRecordOf(data.days, isDay) ||
		!isRecordOf(data.types, isType) ||
		!isRecordOf(data.buildings, isBuilding) ||
		(data.persons !== undefined && !isRecordOf(data.persons, isPerson))
	) {
		throw new Error("Invalid normalised conference schedule");
	}
	for (const [id, event] of Object.entries(data.events)) {
		if (
			event.id !== id ||
			!Object.hasOwn(data.tracks, event.trackKey) ||
			!Object.hasOwn(data.rooms, event.room) ||
			!Object.hasOwn(data.days, event.day) ||
			!Object.hasOwn(data.types, event.type)
		)
			throw new Error(`Invalid schedule references for event ${id}`);
		if (
			!/^([01]\d|2[0-3]):[0-5]\d$/.test(event.startTime) ||
			!/^\d{2,}:[0-5]\d$/.test(event.duration)
		)
			throw new Error(`Invalid schedule time for event ${id}`);
	}
	for (const [id, day] of Object.entries(data.days)) {
		if (
			String(day.id) !== id ||
			data.conference.days[day.id - 1] !== day.date ||
			!Number.isFinite(Date.parse(day.start)) ||
			!Number.isFinite(Date.parse(day.end))
		)
			throw new Error(`Invalid schedule day ${id}`);
	}
	if (Object.keys(data.days).length !== data.conference.days.length)
		throw new Error("Schedule days do not match conference dates");
	const days = data.days;
	for (const [id, track] of Object.entries(data.tracks)) {
		if (
			track.id !== id ||
			!Object.hasOwn(data.types, track.type) ||
			!Object.hasOwn(data.rooms, track.room) ||
			!track.day.every((day) => Object.hasOwn(days, day))
		)
			throw new Error(`Invalid schedule track ${id}`);
	}
}
