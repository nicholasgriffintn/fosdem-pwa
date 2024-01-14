export const constants = {
  STREAM_LINK: 'https://stream.fosdem.org/${ROOM_ID}.m3u8',
  CHAT_LINK: 'https://chat.fosdem.org/#/room/#${ROOM_ID}:fosdem.org',
  SCHEDULE_LINK: 'https://fosdem.org/${YEAR}/schedule/xml',
  TYPES: [
    {
      id: 'keynote',
      name: 'Keynotes',
    },
    {
      id: 'maintrack',
      name: 'Main tracks',
    },
    {
      id: 'devroom',
      name: 'Developer rooms',
    },
    {
      id: 'lightningtalk',
      name: 'Lightning talks',
    },
    {
      id: 'other',
      name: 'Other',
    },
  ],
  BUILDINGS: {
    J: { id: 'J' },
    H: { id: 'H' },
    AW: { id: 'AW' },
    U: { id: 'U' },
    K: { id: 'K' },
  },
};
