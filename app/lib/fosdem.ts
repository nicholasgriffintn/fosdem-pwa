import { xml2json } from 'xml-js';
import { kv } from '@vercel/kv';

import { constants } from '~/constants';

type RoomEvent = {
  _attributes: {
    guid: string;
    id: string;
  };
};

type Room = {
  _attributes: { name: string; slug: string };
  event: RoomEvent | RoomEvent[];
};

type Day = {
  _attributes: { index: number; date: string; start: string; end: string };
  room: Room[];
};

const types = constants.TYPES;
const typesSet = new Set(types.map((type) => type.id));

const buildings = constants.BUILDINGS;

function flattenData(element: unknown) {
  if (Array.isArray(element)) {
    return element.map(flattenData);
  }

  if (typeof element === 'object' && element !== null) {
    const keys = Object.keys(element);

    if (keys.length === 1) {
      const key = keys[0];
      if (key === 'value') {
        return element[key];
      }
    }

    const newElement = {};
    keys.forEach((e) => {
      newElement[e] = flattenData(element[e]);
    });
    return newElement;
  }

  return element;
}

async function parseData(text: string) {
  const data = await xml2json(text, {
    compact: true,
    ignoreDeclaration: true,
    ignoreInstruction: true,
    ignoreComment: true,
    ignoreDoctype: true,
    ignoreCdata: true,
    textFn: (value) => value.trim(),
  });

  const parsed = JSON.parse(data);
  const result = flattenData(parsed.schedule);

  return result;
}

const getRoomName = (name) => {
  if (name.startsWith('D.')) {
    return `${name} (online)`;
  }

  return name;
};

const getPersons = (persons) => {
  return persons && persons[0] && persons[0].person
    ? persons[0].person.map((person) => person.text)
    : [];
};

const getLinkType = (url) => {
  if (url.endsWith('.mp4')) {
    return 'video/mp4';
  } else if (url.endsWith('.webm')) {
    return 'video/webm';
  } else {
    return null;
  }
};

const getLinks = (links) => {
  return links && links[0] && links[0].link
    ? links[0].link.map((link) => ({
        href: link.href,
        title: link.text,
        type: getLinkType(link.href),
      }))
    : [];
};

const getText = (element) =>
  element && element?._text !== null ? element._text : element;

const getStatus = (title) => {
  if (title.includes('canceled')) {
    return 'canceled';
  } else if (title.includes('amendment')) {
    return 'amendment';
  } else {
    return 'running';
  }
};

const getTitle = (title, status) => {
  if (status === 'amendment') {
    return title.substring(10);
  }
  return title;
};

const getType = (event) => {
  const type = getText(event.type);
  if (!typesSet.has(type)) {
    return 'other';
  }
  return type;
};

const buildEvent = (event, isLive, roomName, day) => {
  if (!event) {
    return null;
  }

  const originalTitle = getText(event.title);
  const status = originalTitle
    ? getStatus(originalTitle.toLowerCase())
    : 'unknown';

  if (status === 'canceled') {
    return null;
  }

  const type = getType(event);
  const track = getText(event.track);

  if (type === 'other' && track === 'stand') {
    return null;
  }

  const title = getTitle(originalTitle, status);

  const persons = getPersons(event.persons);
  const links = getLinks(event.links);

  const streams = [];
  const isLiveRoom =
    !roomName.startsWith('B.') &&
    !roomName.startsWith('I.') &&
    !roomName.startsWith('S.');
  const normalizedRoom = roomName.toLowerCase().replace(/\./g, '');
  if (isLiveRoom) {
    streams.push({
      href: constants.STREAM_LINK.replace('${ROOM_ID}', normalizedRoom),
      title: 'Stream',
      type: 'application/vnd.apple.mpegurl',
    });
  }

  const chat = /^[A-Z]\./.test(roomName)
    ? constants.CHAT_LINK.replace('${ROOM_ID}', roomName.substring(2))
    : null;

  return {
    day,
    isLive,
    status,
    type,
    track,
    title,
    persons,
    links,
    streams,
    chat,
    id: event._attributes.id,
    startTime: getText(event.start),
    duration: getText(event.duration),
    subtitle: getText(event.subtitle),
    abstract: getText(event.abstract),
    description: getText(event.description),
  };
};

export async function getData({ year }: { year: string }) {
  /* const cachedData = await kv.get(`fosdem-${year}`);

  if (cachedData) {
    return cachedData;
  } */

  const url = constants.SCHEDULE_LINK.replace('${YEAR}', year);
  const response = await fetch(url);
  const text = await response.text();
  const data = await parseData(text);

  const conferenceDates = data.day.map((day: Day) => day._attributes.date);
  const isLive = conferenceDates.includes(
    new Date().toISOString().substring(0, 10)
  );

  const days = {};
  const rooms = {};
  const events = {};
  const tracks = {};

  for (const day of data.day) {
    const index = day._attributes.index;
    const date = day._attributes.date;
    const start = day._attributes.start;
    const end = day._attributes.end;

    days[index] = {
      date,
      start,
      end,
    };

    for (const room of day.room) {
      const name = getRoomName(room._attributes.name);
      const slug = room._attributes.slug;
      const roomKey = slug.substring(0, 1).toUpperCase();

      const building = buildings[roomKey];

      const roomData = rooms[slug];
      if (!roomData) {
        rooms[slug] = {
          name,
          slug,
          building,
        };
      }

      const roomEvents = Array.isArray(room.event) ? room.event : [room.event];

      for (const event of roomEvents) {
        const eventData = buildEvent(event, isLive, name, index);

        if (!eventData) {
          continue;
        }

        const type = eventData.type;

        const trackData = tracks[eventData.track];
        if (!trackData) {
          const trackKey = eventData.track.toLowerCase().replace(/\s/g, '');
          tracks[trackKey] = {
            name: eventData.track,
            type,
          };
        }

        events[eventData.id] = eventData;
      }
    }
  }

  const conference = data.conference as {
    _attributes: { start: string; end: string };
  };

  const result = {
    conference,
    types,
    buildings,
    days,
    rooms,
    tracks,
    events,
  };

  // await kv.set(`fosdem-${year}`, result, { ex: 900000, nx: true });

  return result;
}
