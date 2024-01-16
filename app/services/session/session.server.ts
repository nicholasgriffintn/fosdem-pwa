import { createCookieSessionStorage } from '@remix-run/cloudflare';
import type { Session } from '@remix-run/cloudflare';

type SessionData = {
  user: {
    id: number;
    name: string;
    type: string;
  };
  theme: string;
};

type SessionFlashData = {
  error: string;
};

export type CustomSession = Session<SessionData, SessionFlashData>;

const {
  getSession: getSessionFromCookie,
  commitSession: commitSessionCookie,
  destroySession: destroySessionCookie,
} = createCookieSessionStorage<SessionData, SessionFlashData>({
  cookie: {
    name: 'fosdem-pwa-auth',
    httpOnly: true,
    maxAge: 3600 * 24 * 30,
    path: '/',
    sameSite: 'lax',
    secrets: ['super_secret'],
    secure: true,
  },
});

export { getSessionFromCookie, commitSessionCookie, destroySessionCookie };
