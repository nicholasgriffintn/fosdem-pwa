import { createCookieSessionStorage } from '@remix-run/cloudflare';

import { Theme, isTheme } from '~/lib/theme-provider';

type SessionData = {
  userId: string;
  theme: string;
};

type SessionFlashData = {
  error: string;
};

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage<SessionData, SessionFlashData>({
    cookie: {
      name: '__session',
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
      sameSite: 'lax',
      secrets: ['super-secret'],
      secure: true,
    },
  });

async function getUserSession(request: Request) {
  const session = await getSession(request.headers.get('Cookie'));
  return {
    getUserId: () => {
      const userValue = session.get('userId');
      return userValue;
    },
    setUserId: (userId: string) => session.set('userId', userId),
    getTheme: () => {
      const themeValue = session.get('theme');
      return isTheme(themeValue) ? themeValue : null;
    },
    setTheme: (theme: Theme) => session.set('theme', theme),
    commit: () => commitSession(session),
  };
}

export { getSession, commitSession, destroySession, getUserSession };
