import { json } from '@remix-run/cloudflare';
import { isbot } from 'isbot';
import { queueToServer } from '@remix-pwa/sync';

import { getDbFromContext, bookmarks } from '~/services/database';

export const action = async ({ request, context }) => {
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

    const body = await request.formData();
    const type = body.get('type');
    const slug = body.get('slug');
    const status = body.get('status');

    if (!type || !slug || !status) {
      return json({
        success: false,
        message: 'Missing required fields',
      });
    }

    const db = getDbFromContext(context);

    const newBookmark = await db
      .insert(bookmarks)
      .values({
        userId: userValue.id,
        type,
        slug,
        status,
      })
      .onConflictDoUpdate({
        target: [bookmarks.userId, bookmarks.slug],
        set: { status },
      })
      .returning({
        id: bookmarks.id,
      })
      .get();

    return json({
      success: true,
      message: 'Bookmark saved',
      data: newBookmark,
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

export const workerAction = async ({ request, context }) => {
  const { fetchFromServer, event } = context;

  try {
    const response = await fetchFromServer(request);
    return response;
  } catch (error) {
    await queueToServer({
      name: 'favourite-item',
      request: event.request.clone(),
    });
  }

  return new Response('Something went wrong', {
    status: 500,
  });
};
