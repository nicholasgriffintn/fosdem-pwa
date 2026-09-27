import { fosdem } from "@roomisfull/conference/profiles/fosdem";

const KEYNOTES_BY_YEAR: Record<string, string[]> = {
	"2026": [
		"8376", // Welcome to FOSDEM 2026
		"7886", // FOSS in times of war, scarcity and (adversarial) AI
		"6895", // Free as in Burned Out: Who Really Pays for Open Source?
		"7772", // Open Source Security in spite of AI
		"8377", // Closing FOSDEM 2026
	],
};

export const constants = {
	STREAM_LINK: fosdem.integrations.stream || "",
	CHAT_LINK: fosdem.integrations.chat || "",
	SCHEDULE_LINK: fosdem.schedule.url,
	TYPES: {
		keynote: {
			id: "keynote",
			name: "Keynotes",
		},
		maintrack: {
			id: "maintrack",
			name: "Main tracks",
		},
		devroom: {
			id: "devroom",
			name: "Developer rooms",
		},
		lightningtalk: {
			id: "lightningtalk",
			name: "Lightning talks",
		},
		other: {
			id: "other",
			name: "Other",
		},
	},
	BUILDINGS: {
		J: { id: "J" },
		H: { id: "H" },
		AW: { id: "AW" },
		U: { id: "U" },
		K: { id: "K" },
	},
	SCHEDULE_FETCH_MAX_RETRIES: 3,
	SCHEDULE_FETCH_TIMEOUT_MS: 10000,
	SCHEDULE_RETRY_BASE_DELAY_MS: 1000,
	KEYNOTES_BY_YEAR,
};
