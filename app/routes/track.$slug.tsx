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
    { title: 'Events - FOSDEM 2024' },
    { name: 'description', content: 'The list of events available' },
  ];
};

export const loader = async ({ params }: LoaderFunctionArgs) => {
  return json({ slug: params.slug });
};

export default function TrackPage() {
  const navigate = useNavigate();

  const { slug } = useLoaderData<typeof loader>();
  const { fosdem } = useRouteLoaderData('root');

  const track = fosdem.tracks[slug];

  const type = fosdem.types[track.type];

  function get24HrFormat(str) {
    const _t = str.split(/[^0-9]/g);
    _t[0] = +_t[0] + (str.indexOf('pm') > -1 && +_t[0] !== 12 ? 12 : 0);
    return _t.join('');
  }

  const eventData = Object.values(fosdem.events)
    .filter((event) => event.trackKey === slug)
    .sort(function (a, b) {
      const t1 = get24HrFormat(a.startTime);
      const t2 = get24HrFormat(b.startTime);
      return t1 > t2 ? 1 : t1 < t2 ? -1 : 0;
    });

  return (
    <div className="min-h-screen">
      <div className="relative py-6 lg:py-10">
        <PageHeader
          heading={track.name}
          text={`${type.name} | Room: ${track.room} | Day ${track.day.join(
            ' and '
          )}`}
        />
        {eventData?.length > 0 && (
          <div className="flex flex-wrap -mx-1 lg:-mx-4">
            {eventData.map((event) => {
              return (
                <div
                  key={event.id}
                  className="my-1 px-1 w-full md:w-1/2 lg:my-4 lg:px-4 lg:w-1/3"
                >
                  <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="p-4">
                      <p className="text-3xl text-gray-900">{event.title}</p>
                      <p className="uppercase tracking-wide text-sm font-bold text-gray-700">
                        Day {event.day} | {event.startTime} | {event.duration} |{' '}
                        {event.room}
                        {event.persons?.length > 0 &&
                          ` | ${event.persons.join(', ')}`}
                      </p>
                      <div>
                        <button
                          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                          onClick={() => navigate(`/event/${event.id}`)}
                        >
                          View
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
