import { createCookieSessionStorage } from '@remix-run/cloudflare';

type SessionData = {
  userId: string;
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
      secrets: [process.env.SESSION_SECRET || 'super-secret'],
      secure: process.env.NODE_ENV === 'production',
    },
  });

export { getSession, commitSession, destroySession };
