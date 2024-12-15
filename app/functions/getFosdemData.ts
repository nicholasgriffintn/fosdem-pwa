import fs from 'node:fs';
import { createServerFn } from '@tanstack/start'

const getFullData = (year: string) => {
  const data = fs.readFileSync(`public/data/fosdem-${year}.json`, 'utf8');

  const json = JSON.parse(data);
  if (!json.conference) {
    throw new Error('Data not found');
  }

  return json;
}

export const getHomepageData = createServerFn({
  method: 'GET',
})
  .validator((data: {
    year: string;
  }) => data)
  .handler(async (ctx) => {
    const data = getFullData(ctx.data.year);

    return {
      conference: data.conference,
      types: data.types,
    };
  })

export const getTypesData = createServerFn({
  method: 'GET',
})
  .validator((data: {
    year: string;
    slug: string;
  }) => data)
  .handler(async (ctx) => {
    const data = getFullData(ctx.data.year);

    const days = Object.values(data.days);
    const track = data.tracks[ctx.data.slug];
    const type = data.types[track.type];
    const trackData = Object.values(data.tracks).filter(
      (track: any) => track.type === ctx.data.slug
    );

    const trackDataSplitByDay: Record<string, any[]> = {};

    trackData.forEach((track: any) => {
      if (!trackDataSplitByDay[track.day[0]]) {
        trackDataSplitByDay[track.day[0]] = [];
      }
      trackDataSplitByDay[track.day[0]].push(track);

      if (track.day[1]) {
        if (!trackDataSplitByDay[track.day[1]]) {
          trackDataSplitByDay[track.day[1]] = [];
        }
        trackDataSplitByDay[track.day[1]].push(track);
      }
    });

    return {
      days,
      track,
      type,
      trackDataSplitByDay,
    };
  })

export const getTrackData = createServerFn({
  method: 'GET',
})
  .validator((data: {
    year: string;
    slug: string;
  }) => data)
  .handler(async (ctx) => {
    const data = getFullData(ctx.data.year);

    const days = Object.values(data.days);

    const track = data.tracks[ctx.data.slug];
    const type = data.types[track.type];

    const eventData = Object.values(data.events).filter(
      (event: any) => event.trackKey === ctx.data.slug
    );

    const eventDataSplitByDay = {};

    eventData.forEach((event) => {
      if (!event.day || !Array.isArray(event.day)) {
        return;
      }

      if (!eventDataSplitByDay[event.day[0]]) {
        eventDataSplitByDay[event.day[0]] = [];
      }
      eventDataSplitByDay[event.day[0]].push(event);

      if (event.day[1]) {
        if (!eventDataSplitByDay[event.day[1]]) {
          eventDataSplitByDay[event.day[1]] = [];
        }
        eventDataSplitByDay[event.day[1]].push(event);
      }
    });

    return {
      days,
      track,
      type,
      eventDataSplitByDay,
    };
  })

export const getEventData = createServerFn({
  method: 'GET',
})
  .validator((data: {
    year: string;
    slug: string;
  }) => data)
  .handler(async (ctx) => {
    const data = getFullData(ctx.data.year);

    const event = fosdem.events[slug];
  })