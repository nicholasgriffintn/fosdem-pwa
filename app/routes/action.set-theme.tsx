import { json } from '@remix-run/cloudflare';
import type { ActionFunction } from '@remix-run/cloudflare';

import { getUserSession } from '~/sessions.server';
import { isTheme } from '~/lib/theme-provider';

export const action: ActionFunction = async ({ request }) => {
  const themeSession = await getUserSession(request);
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
    { headers: { 'Set-Cookie': await themeSession.commit() } }
  );
};
