import type { MetaFunction, LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@vercel/remix';
import {
  useLoaderData,
  useRouteLoaderData,
  useNavigate,
} from '@remix-run/react';

import { PageHeader } from '~/components/PageHeader';

export const meta: MetaFunction = () => {
  return [
    { title: 'Tracks - FOSDEM 2024' },
    { name: 'description', content: 'The list of tracks available' },
  ];
};

export const loader = async ({ params }: LoaderFunctionArgs) => {
  return json({ slug: params.slug });
};

export default function TrackPage() {
  const navigate = useNavigate();

  const { slug } = useLoaderData<typeof loader>();
  const { fosdem } = useRouteLoaderData('root');

  const type = fosdem.types[slug];

  const trackData = Object.values(fosdem.tracks)
    .filter((track) => track.type === slug)
    .sort((a, b) => a.day[0] - b.day[0]);

  return (
    <div className="min-h-screen">
      <div className="relative py-6 lg:py-10">
        <PageHeader heading={type.name} />
        {trackData?.length > 0 && (
          <div className="flex flex-wrap -mx-1 lg:-mx-4">
            {trackData.map((track) => {
              return (
                <div
                  key={track.id}
                  className="my-1 px-1 w-full md:w-1/2 lg:my-4 lg:px-4 lg:w-1/3"
                >
                  <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="p-4">
                      <p className="uppercase tracking-wide text-sm font-bold text-gray-700">
                        {track.type} | DAY {track.day.join(' and ')}
                      </p>
                      <p className="text-3xl text-gray-900">{track.name}</p>
                      <p className="text-gray-700">{track.description}</p>
                      <p className="text-gray-700">
                        {track.eventCount} events | {track.room}
                      </p>
                      <div>
                        <button
                          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                          onClick={() => navigate(`/track/${track.id}`)}
                        >
                          View Track
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
