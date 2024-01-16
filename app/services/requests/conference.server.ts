import { LRUCache } from 'lru-cache';
import { cachified, CacheEntry } from '@epic-web/cachified';

import { constants } from '~/constants';

const lru = new LRUCache<string, CacheEntry>({ max: 1000 });

export function getConferenceData(year: string) {
  return cachified({
    key: `conference-${year}`,
    cache: lru,
    async getFreshValue() {
      try {
        const url = constants.DATA_LINK.replace('${YEAR}', year);
        const response = await fetch(url);
        const data = await response.json();

        if (!data) {
          return null;
        }

        return data;
      } catch (error) {
        console.error(error);
        return null;
      }
    },
    ttl: 300_000,
  });
}
