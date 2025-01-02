export const constants = {
  DEFAULT_YEAR: 2025,
  AVAILABLE_YEARS: [2024, 2025],
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
};