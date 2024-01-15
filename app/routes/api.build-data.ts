import type { LoaderFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';

import type { Env } from '~/types/env';
import { getData } from '~/lib/fosdem';

export async function loader({ context }: LoaderFunctionArgs) {
  const env = context.env as Env;

  const fosdem = await getData({ year: '2024' });

  const response = await env.R2?.put('fosdem.json', JSON.stringify(fosdem), {});

  return json({
    ...response,
  });
}
