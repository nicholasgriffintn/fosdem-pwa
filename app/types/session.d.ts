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
