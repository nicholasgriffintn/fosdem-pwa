import {
  logDevReady,
  createWorkersKVSessionStorage,
} from '@remix-run/cloudflare';
import { createPagesFunctionHandler } from '@remix-run/cloudflare-pages';
import * as build from '@remix-run/dev/server-build';

if (process.env.NODE_ENV === 'development') {
  logDevReady(build);
}

export const onRequest = createPagesFunctionHandler({
  build,
  getLoadContext: (context) => {
    const sessionStorage = createWorkersKVSessionStorage({
      cookie: {
        name: 'fosdem-pwa-auth',
        httpOnly: true,
        maxAge: 3600 * 24 * 30,
        path: '/',
        sameSite: 'lax',
        secrets: ['uL7Ut3vMMqjEvaw2NkdkWFCDP28kZQs0'],
        secure: true,
      },
      kv: context.env.KV,
    });

    return { sessionStorage, env: context.env };
  },
  mode: build.mode,
});
