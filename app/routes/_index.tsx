import type { MetaFunction } from '@remix-run/node';
import { defer } from '@remix-run/node';
import { Await, useLoaderData } from '@remix-run/react';
import { Suspense } from 'react';

import { getSchedule } from '~/lib/fosdem';

export const meta: MetaFunction = () => {
  return [
    { title: 'FOSDEM 2024' },
    { name: 'description', content: 'A companion PWA for FOSDEM 2024' },
  ];
};

export async function loader() {
  const schedule = await getSchedule({ year: '2024' });

  return defer({
    schedule,
  });
}

export default function Index() {
  const { schedule } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen">
      <div className="py-20">
        <h1 className="text-4xl font-bold text-center">Hello World!</h1>
        <Suspense fallback={<div>Loading...</div>}>
          <Await resolve={schedule}>
            {(data) => {
              return (
                <div>
                  <h2 className="text-2xl font-bold text-center">Schedule</h2>
                  <>{console.log(data)}</>
                </div>
              );
            }}
          </Await>
        </Suspense>
      </div>
    </div>
  );
}
