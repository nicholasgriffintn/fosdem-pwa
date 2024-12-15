import { createServerFn } from '@tanstack/start'

import { constants } from '~/constants'

const getFullData = async (year: string) => {
  const url = constants.DATA_LINK.replace('${YEAR}', year);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Data not found');
  }

  const json = await response.json();

  if (!json.conference) {
    throw new Error('Data not found');
  }

  console.log(json.conference)

  return json;
}

export const getHomepageData = createServerFn({
  method: 'GET',
})
  .validator((data: {
    year: string;
  }) => data)
  .handler(async (ctx) => {
    const data = await getFullData(ctx.data.year);

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
    const data = await getFullData(ctx.data.year);

    const days = Object.values(data.days);
    const type = data.types[ctx.data.slug];
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
    const data = await getFullData(ctx.data.year);

    const days = Object.values(data.days);

    const track = data.tracks[ctx.data.slug];
    const type = data.types[track.type];

    const events = Object.values(data.events);

    const eventData = events.filter(
      (event: any) => event.trackKey === ctx.data.slug
    );

    const eventDataSplitByDay: Record<string, any[]> = {};

    eventData.forEach((event: any) => {
      console.log(event)

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
    const data = await getFullData(ctx.data.year);

    const event = data.events[ctx.data.slug];

    return {
      event,
    };
  })
