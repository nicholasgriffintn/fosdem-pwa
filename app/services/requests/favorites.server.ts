import { LRUCache } from 'lru-cache';
import { cachified, CacheEntry } from '@epic-web/cachified';
import { eq } from 'drizzle-orm';

import { getDbFromContext, bookmarks } from '~/services/database';

const lru = new LRUCache<string, CacheEntry>({ max: 1000 });

export function getFavouritesData(userId: number, context: any) {
  return cachified({
    key: `favourites-${userId}`,
    cache: lru,
    async getFreshValue() {
      try {
        if (!userId || !context) {
          return null;
        }

        const db = getDbFromContext(context);

        const existingBookmark = await db
          .select({
            id: bookmarks.id,
            type: bookmarks.type,
            slug: bookmarks.slug,
            status: bookmarks.status,
          })
          .from(bookmarks)
          .where(eq(bookmarks.userId, userId))
          .all();

        return existingBookmark;
      } catch (error) {
        console.error(error);
        return null;
      }
    },
    ttl: 300_000,
  });
}
