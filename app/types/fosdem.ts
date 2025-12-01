export interface ConferenceData {
	acronym: string;
	title: string;
	subtitle?: string;
	venue: string;
	city: string;
	end: string;
	start: string;
	days: string[];
	day_change: string;
	timeslot_duration: string;
	time_zone_name: string;
}

export type TypeIds =
	| "keynote"
	| "maintrack"
	| "devroom"
	| "lightningtalk"
	| "other";

export interface TypeData {
	id: TypeIds;
	name: string;
	trackCount: number;
	eventCount: number;
	roomCount: number;
	buildingCount: number;
}

export interface BuildingData {
	id: string;
	roomCount: number;
	trackCount: number;
	eventCount: number;
}

export interface DayData {
	date: string;
	start: string;
	end: string;
	id: string;
	name: string;
	eventCount: number;
	trackCount: number;
	roomCount: number;
	buildingCount: number;
}

export interface RoomData {
	name: string;
	slug: string;
	buildingId?: string;
	building?: BuildingData;
	eventCount: number;
}

export interface Track {
	id: string;
	name: string;
	description: string;
	room: string;
	type: string;
	day: number;
	eventCount: number;
	isFavourited?: boolean;
}

export interface Event {
	title: string;
	subtitle?: string;
	description: string;
	room: string;
	persons: string[];
	id: string;
	startTime: string;
	duration: string;
	abstract: string;
	chat: string;
	links: {
		href: string;
		title: string;
		type: string;
	}[];
	attachments: {
		type: string;
		href: string;
		title: string;
	}[];
	streams: {
		href: string;
		title: string;
		type: string;
	}[];
	day: string | number | string[] | number[];
	trackKey: string;
	isLive: boolean;
	status: string;
	type: string;
	url: string;
	feedbackUrl: string;
	language: string;
	isFavourited?: boolean;
	priority?: number;
}

export interface Conference {
	conference: ConferenceData;
	types: Record<string, TypeData>;
	buildings: Record<string, BuildingData>;
	rooms: Record<string, RoomData>;
	days: Record<string, DayData>;
	tracks: Record<string, Track>;
	events: Record<string, Event>;
}

export interface DayGroupedData {
	[key: string]: any[];
}
