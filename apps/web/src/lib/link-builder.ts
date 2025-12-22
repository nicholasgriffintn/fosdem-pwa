import { constants } from "~/constants";

interface LinkBuilderOptions {
  year?: number;
}

interface EventLinkOptions extends LinkBuilderOptions {
  test?: boolean;
}

interface TrackLinkOptions extends LinkBuilderOptions {
  day?: string | undefined;
  view?: string | undefined;
  sortFavourites?: string | undefined;
}

interface RoomLinkOptions extends LinkBuilderOptions {
  day?: string | undefined;
  sortFavourites?: string | undefined;
}

interface SearchLinkOptions extends LinkBuilderOptions {
  q?: string;
  track?: string | undefined;
  time?: string | undefined;
  type?: string;
}

export function buildRoomLink(roomId: string, options: RoomLinkOptions = {}) {
  return {
    to: "/rooms/$roomId" as const,
    params: { roomId },
    search: {
      year: options.year || constants.DEFAULT_YEAR,
      day: options.day ?? undefined,
      sortFavourites: options.sortFavourites ?? undefined,
    },
  };
}

export function buildSearchLink(options: SearchLinkOptions) {
  return {
    to: "/search" as const,
    search: {
      year: options.year || constants.DEFAULT_YEAR,
      q: options.q || "",
      track: options.track ?? undefined,
      time: options.time ?? undefined,
      type: options.type ?? "all",
    },
  };
}

export function buildEventLink(slug: string, options: EventLinkOptions = {}) {
  return {
    to: "/event/$slug" as const,
    params: { slug },
    search: {
      year: options.year || constants.DEFAULT_YEAR,
      test: options.test ?? false,
    },
  };
}

export function buildTrackLink(slug: string, options: TrackLinkOptions = {}) {
  return {
    to: "/track/$slug" as const,
    params: { slug },
    search: {
      year: options.year || constants.DEFAULT_YEAR,
      day: options.day ?? undefined,
      view: options.view ?? undefined,
      sortFavourites: options.sortFavourites ?? undefined,
    },
  };
}

export function buildHomeLink(options: LinkBuilderOptions = {}) {
  return {
    to: "/" as const,
    search: {
      year: options.year || constants.DEFAULT_YEAR,
    },
  };
}
