import { createServerFn } from '@tanstack/start'
import { constants } from '~/constants'

interface Conference {
  conference: any;
  types: Record<string, any>;
  days: Record<string, any>;
  tracks: Record<string, Track>;
  events: Record<string, Event>;
}

interface Track {
  name: string;
  description: string;
  room: string;
  type: string;
  day: number;
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
  day: string[];
  trackKey: string;
  isLive: boolean;
  status: string;
  type: string;
}

interface DayGroupedData {
  [key: string]: any[];
}

/**
 * Fetches and validates conference data for a given year
 */
const getFullData = async (year: string): Promise<Conference> => {
  const url = constants.DATA_LINK.replace('${YEAR}', year);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch data: ${response.statusText}`);
  }

  const json = await response.json();

  if (!json.conference) {
    throw new Error('Invalid conference data format');
  }

  return json;
}

/**
 * Groups data by day, handling multi-day items
 */
const groupByDay = (items: any[], getDayFn: (item: any) => string[]): DayGroupedData => {
  return items.reduce((acc: DayGroupedData, item) => {
    const dayValue = getDayFn(item);
    const days = Array.isArray(dayValue) ? dayValue : [String(dayValue)];

    days.forEach(day => {
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push(item);
    });

    return acc;
  }, {});
};

export const getHomepageData = createServerFn({
  method: 'GET',
})
  .validator((data: { year: string }) => data)
  .handler(async (ctx) => {
    const data = await getFullData(ctx.data.year);
    return {
      conference: data.conference,
      types: data.types,
    };
  });

export const getTypesData = createServerFn({
  method: 'GET',
})
  .validator((data: { year: string; slug: string }) => data)
  .handler(async (ctx) => {
    const data = await getFullData(ctx.data.year);
    const days = Object.values(data.days);
    const type = data.types[ctx.data.slug];

    const trackData = Object.values(data.tracks).filter(
      (track: Track) => track.type === ctx.data.slug
    );

    const trackDataSplitByDay = groupByDay(trackData, track => track.day);

    return { days, type, trackDataSplitByDay };
  });

export const getTrackData = createServerFn({
  method: 'GET',
})
  .validator((data: { year: string; slug: string }) => data)
  .handler(async (ctx) => {
    const data = await getFullData(ctx.data.year);
    const days = Object.values(data.days);
    const track = data.tracks[ctx.data.slug];
    const type = data.types[track.type];

    const eventData = Object.values(data.events).filter(
      (event: Event) => event.trackKey === ctx.data.slug
    );

    const eventDataSplitByDay = groupByDay(eventData, event => event.day);

    return { days, track, type, eventDataSplitByDay };
  });

export const getEventData = createServerFn({
  method: 'GET',
})
  .validator((data: { year: string; slug: string }) => data)
  .handler(async (ctx) => {
    const data = await getFullData(ctx.data.year);
    return { event: data.events[ctx.data.slug] };
  });

export const getTestEventData = createServerFn({
  method: 'GET',
})
  .handler(async () => ({
    event: {
      day: ["1"],
      isLive: true,
      slug: "test-live",
      description: "This is a test of the live player - ignore",
      status: "running",
      type: "devroom",
      track: "Radio",
      trackKey: "radio",
      title: "THIS IS A TEST OF THE LIVE PLAYER - IGNORE",
      persons: ["Nicholas Griffin"],
      links: [{
        href: "https://rdmedia.bbc.co.uk/testcard/simulcast/",
        title: "BBC R&D Test Cards",
        type: "external"
      }],
      streams: [
        {
          href: "https://rdmedia.bbc.co.uk/testcard/simulcast/manifests/avc-full.m3u8",
          title: "AVC (All representations in all languages)",
          type: "application/vnd.apple.mpegurl"
        },
        {
          href: "https://rdmedia.bbc.co.uk/testcard/simulcast/manifests/radio-en.m3u8",
          title: "Audio Only (HE and LC AAC Stereo in English)",
          type: "application/vnd.apple.mpegurl"
        },
      ],
      chat: 'https://fosdem.org/2025/schedule/event/test-live/chat',
      room: "UB2.147",
      id: "test-live",
      startTime: "15:30",
      duration: "01:00",
      abstract: "<p>This is just a test to confirm things work before FOSDOM</p>"
    },
  }));

