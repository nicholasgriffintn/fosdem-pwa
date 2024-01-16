import { json } from '@remix-run/cloudflare';
import type { ActionFunction } from '@remix-run/cloudflare';

import { getThemeFromSession } from '~/services/theme';
import { getSessionFromCookie, commitSessionCookie } from '~/services/session';
import { isTheme } from '~/lib/theme-provider';

export const action: ActionFunction = async ({ request }) => {
  const cookie = request.headers.get('Cookie') || '';
  const session = await getSessionFromCookie(cookie);
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
    { headers: { 'Set-Cookie': await commitSessionCookie(session) } }
  );
};
