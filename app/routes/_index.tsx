import type { MetaFunction } from '@remix-run/cloudflare';
import { Await, useRouteLoaderData } from '@remix-run/react';
import { Suspense } from 'react';

import { Types, TypesSkeleton } from '~/components/Types';

export const meta: MetaFunction = () => {
  return [
    { title: 'FOSDEM 2025' },
    { name: 'description', content: 'A companion PWA for FOSDEM 2025' },
  ];
};

export default function Index() {
  const { fosdem } = useRouteLoaderData('root');

  if (!fosdem) return null;

  return (
    <div className="min-h-screen">
      <div className="relative py-6 lg:py-10">
        <Suspense fallback={<TypesSkeleton />}>
          <Await resolve={fosdem}>
            {(data) => {
              return <Types types={data.types} />;
            }}
          </Await>
        </Suspense>
      </div>
    </div>
  );
}
