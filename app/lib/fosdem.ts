import { xml2json } from 'xml-js';
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

const tracks = constants.MAIN_TRACKS;
const trackSet = new Set(tracks.map((track) => track.id));

function flattenData(element: unknown) {
  if (Array.isArray(element)) {
    return element.map(flattenData);
  }

  if (typeof element === 'object' && element !== null) {
    const result: { [key: string]: unknown } = {};
    for (const [key, value] of Object.entries(element)) {
      result[key] = flattenData(value);
    }
    return result;
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
  if (!trackSet.has(type)) {
    return 'other';
  }
  return type;
};

const buildEvent = (event, isLive, roomName) => {
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
  if (isLive && isLiveRoom) {
    streams.push({
      href: constants.STREAM_LINK.replace('${ROOM_ID}', normalizedRoom),
      title: 'Stream',
      type: 'application/vnd.apple.mpegurl',
    });
  }

  const chat = /^[A-Z]\./.test(roomName)
    ? constants.CHAT_LINK.replace('${ROOM_ID}', normalizedRoom)
    : null;

  return {
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
  const url = constants.SCHEDULE_LINK.replace('${YEAR}', year);
  const response = await fetch(url);
  const text = await response.text();
  const data = await parseData(text);

  const conferenceDates = data.day.map((day: Day) => day._attributes.date);
  const isLive = conferenceDates.includes(
    new Date().toISOString().substring(0, 10)
  );

  const days = data.day.map((day: Day) => {
    const date = day._attributes.date;
    const start = day._attributes.start;
    const end = day._attributes.end;

    const rooms = day.room.map((room: Room) => {
      const name = getRoomName(room._attributes.name);
      const slug = room._attributes.slug;

      const roomEvents = Array.isArray(room.event) ? room.event : [room.event];

      const track = roomEvents?.[0]?.type ? getType(roomEvents[0]) : 'other';

      const events = roomEvents.map((event) => {
        return buildEvent(event, isLive, name);
      });

      return {
        name,
        slug,
        track,
        events,
      };
    });

    return {
      date,
      start,
      end,
      rooms,
    };
  });

  const conference = data.conference as {
    _attributes: { start: string; end: string };
  };

  const allRooms = days.flatMap((day) => day.rooms);

  const tracksData = constants.MAIN_TRACKS.map((track) => {
    const rooms = allRooms.filter((room) => room && room.track === track.id);
    return {
      ...track,
      rooms,
    };
  });

  return {
    tracks: tracksData,
    conference,
  };
}
