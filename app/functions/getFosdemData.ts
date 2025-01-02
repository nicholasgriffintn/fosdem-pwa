import { createServerFn } from '@tanstack/start'

import { constants } from '~/constants'
import type { Conference } from '~/types/fosdem'

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

export const getAllData = createServerFn({
  method: 'GET',
})
  .validator((data: { year: number }) => data)
  .handler(async (ctx: any) => {
    const data = await getFullData(ctx.data.year);
    return data;
  });

