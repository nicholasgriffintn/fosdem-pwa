import type { LoaderFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';

import type { Env } from '~/types/env';
import { buildData } from '~/lib/fosdem';

export async function loader({ request, context }: LoaderFunctionArgs) {
  try {
    const env = context.env as Env;

    const secret = request.headers.get('X-Fosdem-Secret');
    if (secret !== env.FOSDEM_SECRET) {
      return json({
        status: 403,
        message: 'Forbidden',
      });
    }

    const fosdem = await buildData({ year: '2025' });

    const response = await env.R2?.put(
      'fosdem-2025.json',
      JSON.stringify(fosdem),
      {}
    );

    return json({
      ...response,
    });
  } catch (error) {
    console.error(error);

    return json({
      status: 500,
      message: error.message,
    });
  }
}
