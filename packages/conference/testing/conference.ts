import type { ConferenceConfig } from "../src/types.ts";

export const testConference: ConferenceConfig = {
	id: "example",
	name: "Example Conference",
	appName: "Example Conference",
	website: "https://conference.example.org",
	appUrl: "https://companion.example.org",
	dataUrl: "https://data.example.org",
	dataPrefix: "example",
	defaultYear: 2027,
	years: [2027],
	timeZone: "America/New_York",
	venue: "Conference Centre",
	city: "New York",
	editions: { "2027": { dates: ["2027-06-10", "2027-06-11", "2027-06-12"] } },
	schedule: {
		provider: "json",
		url: "https://conference.example.org/schedule-${YEAR}.json",
	},
	integrations: { subtitleHosts: [] },
	storage: {
		offlineDatabase: "roomisfull_example",
		syncKey: "roomisfull_example_sync",
		playerKey: "roomisfull_example_player",
	},
};
