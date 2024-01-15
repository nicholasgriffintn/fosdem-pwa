import type { LoaderFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';

import type { Env } from '~/types/env';
import { buildData } from '~/lib/fosdem';

export async function loader({ request, context }: LoaderFunctionArgs) {
  const now = new Date();
  if (
    now.getFullYear() !== 2024 ||
    now.getMonth() !== 1 ||
    now.getDate() < 3 ||
    now.getDate() > 4
  ) {
    return json({
      status: 403,
      message: 'Forbidden',
    });
  }

  const env = context.env as Env;

  const secret = request.headers.get('X-Fosdem-Secret');
  if (secret !== env.FOSDEM_SECRET) {
    return json({
      status: 403,
      message: 'Forbidden',
    });
  }

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
