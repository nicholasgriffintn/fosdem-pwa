// Year-specific keynote event IDs - temp measure until we have a featured flag.
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
  DATA_LINK: 'https://r2.fosdempwa.com/fosdem-${YEAR}.json',
  STREAM_LINK: 'https://stream.fosdem.org/${ROOM_ID}.m3u8',
  CHAT_LINK: 'https://chat.fosdem.org/#/room/#${ROOM_ID}:fosdem.org',
  SCHEDULE_LINK: 'https://fosdem.org/${YEAR}/schedule/xml',
  TYPES: {
    keynote: {
      id: 'keynote',
      name: 'Keynotes',
    },
    maintrack: {
      id: 'maintrack',
      name: 'Main tracks',
    },
    devroom: {
      id: 'devroom',
      name: 'Developer rooms',
    },
    lightningtalk: {
      id: 'lightningtalk',
      name: 'Lightning talks',
    },
    other: {
      id: 'other',
      name: 'Other',
    },
  },
  BUILDINGS: {
    J: { id: 'J' },
    H: { id: 'H' },
    AW: { id: 'AW' },
    U: { id: 'U' },
    K: { id: 'K' },
  },
  SCHEDULE_FETCH_MAX_RETRIES: 3,
  SCHEDULE_FETCH_TIMEOUT_MS: 10000,
  SCHEDULE_RETRY_BASE_DELAY_MS: 1000,
  KEYNOTES_BY_YEAR,
};