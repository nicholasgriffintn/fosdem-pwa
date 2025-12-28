export const constants = {
	TIME_ZONE: "Europe/Brussels",
	TURNSTILE_SITE_KEY: "0x4AAAAAAA4mg92kNkVgcTr6",
	VAPID_PUBLIC_KEY:
		"BAGvS96F8zUSCwKps_ycFywhpmvFCU6_7m2K4JvJDIU24tExvMihRazgffPDa1Z6Yc6pUauJ4PyMKZ6ioznmOKE",
	DEFAULT_YEAR: 2026,
	AVAILABLE_YEARS: [
		2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023,
		2024, 2025, 2026,
	],
	DATA_LINK: "https://r2.fosdempwa.com/fosdem-${YEAR}.json",
	STREAM_LINK: "https://stream.fosdem.org/${ROOM_ID}.m3u8",
	CHAT_LINK: "https://chat.fosdem.org/#/room/#${ROOM_ID}:fosdem.org",
	SCHEDULE_LINK: "https://fosdem.org/${YEAR}/schedule/xml",
	NAVIGATE_TO_LOCATION_LINK: "https://nav.fosdem.org/d/${LOCATION_ID}/",
	ROOMS_API: "https://api.fosdem.org/roomstatus/v1/listrooms",
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
};
