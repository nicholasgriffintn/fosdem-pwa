import { json } from '@remix-run/cloudflare';
import { eq } from 'drizzle-orm';
import { isbot } from 'isbot';

import { getDbFromContext, bookmarks } from '~/services/database';

export const loader = async ({ request, context }) => {
  try {
    const userAgent = request.headers.get('User-Agent') || '';

    const isThisUserABot = isbot(userAgent);
    if (isThisUserABot || !userAgent) {
      return null;
    }

    const cookie = request.headers.get('Cookie') || '';
    const session = await context.sessionStorage.getSession(cookie);

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
  } catch (error) {
    console.error(error);

    return json(
      {
        success: false,
        message: 'An error occurred',
        data: error,
      },
      { status: 500 }
    );
  }
};
