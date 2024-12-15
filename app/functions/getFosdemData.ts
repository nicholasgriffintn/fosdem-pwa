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

interface Event {
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
      day: "1",
      isLive: true,
      status: "running",
      type: "devroom",
      track: "Radio",
      trackKey: "radio",
      title: "THIS IS A TEST OF THE LIVE PLAYER - IGNORE",
      persons: ["Nicholas Griffin"],
      links: [{
        href: "https://www.bbc.co.uk/sounds/play/live:bbc_radio_one",
        title: "Listen on Sounds",
        type: null
      }],
      streams: [
        {
          href: "https://vs-hls-pushb-uk.live.fastly.md.bbci.co.uk/x=4/i=urn:bbc:pips:service:video_pop_up_channel_04/iptv_hd_abr_v1.m3u8",
          title: "Video Stream",
          type: "application/vnd.apple.mpegurl"
        },
        {
          href: "http://as-hls-ww-live.akamaized.net/pool_900/live/ww/bbc_radio_one/bbc_radio_one.isml/bbc_radio_one-audio%3d96000.norewind.m3u8",
          title: "Audio Stream",
          type: "application/vnd.apple.mpegurl"
        }
      ],
      chat: null,
      room: "UB2.147",
      id: "test-live",
      startTime: "15:30",
      duration: "01:00",
      abstract: "<p>This is just a test to confirm things work before FOSDOM</p>"
    },
  }));

