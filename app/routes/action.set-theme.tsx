import { json } from '@remix-run/cloudflare';
import { queueToServer } from '@remix-pwa/sync';

import { getThemeFromSession } from '~/services/theme';
import { isTheme } from '~/lib/theme-provider';

export const action = async ({ request, context }) => {
  try {
    const cookie = request.headers.get('Cookie') || '';
    const session = await context.sessionStorage.getSession(cookie);
    const themeSession = await getThemeFromSession(session);

    const requestText = await request.text();
    const form = new URLSearchParams(requestText);
    const theme = form.get('theme');

    if (!isTheme(theme)) {
      return json({
        success: false,
        message: `theme value of ${theme} is not a valid theme`,
      });
    }

    themeSession.setTheme(theme);
    return json(
      { success: true },
      {
        headers: {
          'Set-Cookie': await context.sessionStorage.commitSession(session),
        },
      }
    );
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
      name: 'set-theme',
      request: event.request.clone(),
    });
  }

  return json(
    {
      success: false,
      message: 'An error occurred',
      status: 'queued',
    },
    { status: 500 }
  );
};
