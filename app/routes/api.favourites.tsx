import { json } from '@remix-run/cloudflare';
import type { LoaderFunctionArgs } from '@remix-run/cloudflare';
import { eq } from 'drizzle-orm';
import { isbot } from 'isbot';

import { getSessionFromCookie } from '~/services/session';
import { getDbFromContext, bookmarks } from '~/services/database';

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  const userAgent = request.headers.get('User-Agent') || '';

  const isThisUserABot = isbot(userAgent);
  if (isThisUserABot || !userAgent) {
    return null;
  }

  const cookie = request.headers.get('Cookie') || '';
  const session = await getSessionFromCookie(cookie);

  const userValue = session.get('user');

  if (!userValue.id) {
    return json({
      success: false,
      message: 'User is not logged in',
    });
  }

  const db = getDbFromContext(context);

  const existingBookmark = await db
    .select({
      id: bookmarks.id,
      type: bookmarks.type,
      slug: bookmarks.slug,
    })
    .from(bookmarks)
    .where(eq(bookmarks.userId, userValue.id))
    .get();

  return json({
    success: true,
    message: 'Bookmark retrieved',
    data: existingBookmark,
  });
};
