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


export const getTestEventData = createServerFn({
  method: 'GET',
})
  .handler(async (ctx) => {
    return {
      event: {
        "day": "1",
        "isLive": true,
        "status": "running",
        "type": "devroom",
        "track": "Radio",
        "trackKey": "radio",
        "title": "THIS IS A TEST OF THE LIVE PLAYER - IGNORE",
        "persons": [
          "Nicholas Griffin"
        ],
        "links": [
          {
            "href": "https://www.bbc.co.uk/sounds/play/live:bbc_radio_one",
            "title": "Listen on Sounds",
            "type": null
          }
        ],
        "streams": [
          {
            "href": "https://vs-hls-pushb-uk.live.fastly.md.bbci.co.uk/x=4/i=urn:bbc:pips:service:video_pop_up_channel_04/iptv_hd_abr_v1.m3u8",
            "title": "Video Stream",
            "type": "application/vnd.apple.mpegurl"
          },
          {
            "href": "http://as-hls-ww-live.akamaized.net/pool_900/live/ww/bbc_radio_one/bbc_radio_one.isml/bbc_radio_one-audio%3d96000.norewind.m3u8",
            "title": "Audio Stream",
            "type": "application/vnd.apple.mpegurl"
          }
        ],
        "chat": null,
        "room": "UB2.147",
        "id": "test-live",
        "startTime": "15:30",
        "duration": "01:00",
        "abstract": "<p>This is just a test to confirm things work before FOSDOM</p>"
      },
    };
  })

