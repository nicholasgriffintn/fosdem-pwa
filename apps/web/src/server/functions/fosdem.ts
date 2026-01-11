import { createServerFn } from "@tanstack/react-start";

import { constants } from "~/constants";
import type { Conference } from "~/types/fosdem";
import { isValidYear, isNumber } from "~/lib/type-guards";
import { CacheManager } from "~/server/cache";
import { CacheKeys } from "~/server/lib/cache-keys";
import { CONSTANTS } from "~/server/constants";

const getCacheTTL = (year: number): number => {
  return year === constants.DEFAULT_YEAR
    ? CONSTANTS.CURRENT_YEAR_TTL
    : CONSTANTS.PAST_YEAR_TTL;
};

const cache = CacheManager.getInstance();

const revalidationInProgress = new Set<number>();

const fetchFromSource = async (year: number): Promise<Conference> => {
  const url = constants.DATA_LINK.replace("${YEAR}", year.toString());
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CONSTANTS.FETCH_TIMEOUT_MS);

  let response: Response;

  try {
    const cacheTtl = getCacheTTL(year);
    response = await fetch(url, {
      signal: controller.signal,
      cf: { cacheTtl, cacheEverything: true },
    });
    clearTimeout(timeout);
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();

  if (!json || typeof json !== "object" || !("conference" in json)) {
    throw new Error(`Invalid conference data format: ${JSON.stringify(json)}`);
  }

  return json as Conference;
};

const revalidateInBackground = (year: number) => {
  if (revalidationInProgress.has(year)) return;

  revalidationInProgress.add(year);

  fetchFromSource(year)
    .then(async (data) => {
      await cache.setWithSoftExpiry(CacheKeys.fosdemData(year), data, getCacheTTL(year));
    })
    .catch((error) => {
      console.error(`Background revalidation failed for year ${year}:`, error);
    })
    .finally(() => {
      revalidationInProgress.delete(year);
    });
};

const getFullData = async (year: number): Promise<Conference> => {
  if (!isValidYear(year)) {
    throw new Error("Invalid year; expected YYYY between 2000-2100");
  }

  const cacheKey = CacheKeys.fosdemData(year);
  const cached = await cache.getWithStaleness(cacheKey);

  if (
    cached &&
    typeof cached.data === "object" &&
    cached.data !== null &&
    "conference" in cached.data
  ) {
    if (cached.isStale) {
      revalidateInBackground(year);
    }
    return cached.data as Conference;
  }

  try {
    const data = await fetchFromSource(year);
    await cache.setWithSoftExpiry(cacheKey, data, getCacheTTL(year));
    return data;
  } catch (error) {
    if ((error as Error)?.name === "AbortError") {
      const staleData = await cache.get(cacheKey);
      if (staleData && typeof staleData === "object" && "conference" in staleData) {
        console.warn(`Timeout fetching year ${year}, returning stale data`);
        return staleData as Conference;
      }
      throw new Error("Fetching conference data timed out");
    }
    throw error;
  }
};

export const getAllData = createServerFn({
  method: "GET",
})
  .inputValidator((data: unknown): { year: number } => {
    if (
      typeof data === "object" &&
      data !== null &&
      "year" in data &&
      isNumber(data.year)
    ) {
      return { year: data.year };
    }
    throw new Error("Invalid input; expected { year: number }");
  })
  .handler(async (ctx: { data: { year: number } }) => {
    const data = await getFullData(ctx.data.year);
    return data;
  });
