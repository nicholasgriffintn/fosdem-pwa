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

  const event = fosdem.events[slug];

  console.log(event);

  return (
    <div className="min-h-screen">
      <div className="relative py-6 lg:py-10">
        <PageHeader
          heading={event.title}
          text={`Day ${event.day} | ${event.startTime} | ${event.duration} | ${
            event.room
          }${event.persons?.length > 0 && ` | ${event.persons.join(', ')}`}`}
        />
        {event.abstract && (
          <div className="mt-8 prose prose-lg prose-indigo">
            <div dangerouslySetInnerHTML={{ __html: event.abstract }} />
          </div>
        )}
        {event.chat && (
          <div>
            <a href={event.chat}>Chat</a>
          </div>
        )}
        {event.links?.length > 0 && (
          <div>
            <h2>Links</h2>
            <ul>
              {event.links.map((link) => {
                return (
                  <li key={link.url}>
                    <a href={link.url}>{link.title}</a>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        {event.isLive && event.streams?.length && (
          <div>
            <h2>Streams</h2>
            <div>
              {event.streams.map((stream) => {
                return (
                  <div key={stream.url}>
                    <h3>{stream.title}</h3>
                    <video src={stream.url} controls></video>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
