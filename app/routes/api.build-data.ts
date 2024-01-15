import type { LoaderFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';

import type { Env } from '~/types/env';
import { buildData } from '~/lib/fosdem';

export async function loader({ context }: LoaderFunctionArgs) {
  const env = context.env as Env;

  const fosdem = await buildData({ year: '2024' });

  const response = await env.R2?.put(
    'fosdem-2024.json',
    JSON.stringify(fosdem),
    {}
  );

  return json({
    ...response,
  });
}
