import type { ActionFunctionArgs } from '@remix-run/node';
import fs from 'fs';

import { getData } from '~/lib/fosdem';

export const loader = async ({ request }: ActionFunctionArgs) => {
  switch (request.method) {
    case 'GET': {
      const data = await getData({ year: '2024' });

      try {
        fs.writeFileSync('./public/fosdem.json', JSON.stringify(data, null, 2));

        return new Response('File written', { status: 200 });
      } catch (error) {
        console.error(error);

        return new Response('Error writing file', { status: 500 });
      }
    }
  }
};
