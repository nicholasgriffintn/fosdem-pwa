export interface ConferenceData {
	title: {
		_text: string;
	};
	subtitle: {
		_text?: string;
	};
	city: {
		_text: string;
	};
	end: {
		_text: string;
	};
	start: {
		_text: string;
	};
	days: {
		_text: string;
	};
	day_change: {
		_text: string;
	};
	timeslot_duration: {
		_text: string;
	};
}

export interface Conference {
	conference: ConferenceData;
	types: Record<string, any>;
	days: Record<string, any>;
	tracks: Record<string, Track>;
	events: Record<string, Event>;
}

export interface Track {
	id: string;
	name: string;
	description: string;
	room: string;
	type: string;
	day: number;
	eventCount: number;
}

export interface Event {
	title: string;
	description: string;
	room: string;
	persons: string[];
	slug: string;
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
}

export interface DayGroupedData {
	[key: string]: any[];
}

export type FosdemImageType =
	| "keynote"
	| "maintrack"
	| "devroom"
	| "lightningtalk"
	| "other";
