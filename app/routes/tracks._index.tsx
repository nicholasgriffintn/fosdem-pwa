import type { MetaFunction } from '@remix-run/node';
import { Await, useRouteLoaderData } from '@remix-run/react';
import { Suspense } from 'react';

import { Tracks, TracksSkeleton } from '~/components/Tracks';
import { PageHeader } from '~/components/PageHeader';

export const meta: MetaFunction = () => {
  return [
    { title: 'Tracks - FOSDEM 2024' },
    { name: 'description', content: 'The available tracks at FOSDEM 2024' },
  ];
};

export default function Index() {
  const { fosdem } = useRouteLoaderData('root');

  return (
    <div className="min-h-screen">
      <div className="relative py-6 lg:py-10">
        <PageHeader heading="Tracks" />
        <Suspense fallback={<TracksSkeleton />}>
          <Await resolve={fosdem}>
            {(data) => {
              return <Tracks tracks={data.tracks} />;
            }}
          </Await>
        </Suspense>
      </div>
    </div>
  );
}
