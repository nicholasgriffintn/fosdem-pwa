import type { MetaFunction, LoaderFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';
import { useLoaderData, useRouteLoaderData } from '@remix-run/react';
import clsx from 'clsx';

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '~/components/ui/resizable';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { PageHeader } from '~/components/PageHeader';
import { Icons } from '~/components/Icons';
import { useWindowSize } from '~/hooks/useWindowSize';
import { FavouriteButton } from '../components/FavouriteButton';
import { ShareButton } from '~/components/ShareButton';

export const meta: MetaFunction = () => {
  return [
    { title: 'Events - FOSDEM 2025' },
    { name: 'description', content: 'The list of events available' },
  ];
};

export const loader = async ({ params }: LoaderFunctionArgs) => {
  return json({ slug: params.slug });
};

function EventPlayer({ event, isMobile = false }) {
  const videoWrapperClassName = clsx(
    'flex h-full items-center justify-center bg-muted text-muted-foreground relative',
    {
      'min-h-[340px] rounded-md': isMobile,
      'min-h-[640px]': !isMobile,
    }
  );
  return (
    <div className={videoWrapperClassName}>
      {event.isLive && event.streams?.length ? (
        <div>
          {event.streams.map((stream) => {
            return (
              <div key={stream.url} className="w-full aspect-video">
                <video preload="none" controls="controls">
                  <source
                    src={stream.url}
                    type='application/x-mpegURL; codecs="avc1.42E01E, mp4a.40.2"'
                  />
                </video>
              </div>
            );
          })}
        </div>
      ) : (
        <div>
          <div
            className={`bg-${event.type} w-full h-full absolute top-0 left-0 z-0'`}
          />
          <div className="p-6 relative bg-muted p-6 rounded-md">
            <span>Sorry! The stream isn't available yet!</span>
          </div>
        </div>
      )}
    </div>
  );
}

function EventSidebar({ event, isMobile = false }) {
  const sidebarClassName = clsx('h-full', {
    'p-6': !isMobile,
    'pt-6 pb-6': isMobile,
  });

  const abstractClassName = clsx(
    'w-full prose prose-lg prose-indigo overflow-scroll',
    {
      'max-h-[420px]': !isMobile,
    }
  );

  return (
    <div className={sidebarClassName}>
      {event.abstract && (
        <div className={abstractClassName}>
          <div dangerouslySetInnerHTML={{ __html: event.abstract }} />
        </div>
      )}
      {event.links?.length > 0 && (
        <div>
          <hr className="my-4" />
          <h2>Links</h2>
          <ul>
            {event.links.map((link) => {
              return (
                <li key={link.href}>
                  <a href={link.href} target="_blank" rel="noreferrer">
                    {link.title}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function TrackPage() {
  const { slug } = useLoaderData<typeof loader>();
  const { fosdem, favourites } = useRouteLoaderData('root');

  const { width } = useWindowSize();

  if (!fosdem) return null;

  const event = fosdem.events[slug];
  const isFavourite = favourites?.length
    ? favourites.find((favourite) => favourite.slug === slug)
    : false;

  return (
    <div className="min-h-screen">
      <div className="relative py-6 lg:py-10">
        <PageHeader
          heading={event.title}
          text={`Day ${event.day} | ${event.startTime} | ${event.duration} | ${
            event.room
          }${event.persons?.length > 0 && ` | ${event.persons.join(', ')}`}`}
        >
          <div className="flex items-center pl-6 pr-3 gap-2">
            <FavouriteButton
              type="event"
              slug={slug}
              status={isFavourite?.status ?? 'unfavourited'}
            />
            <ShareButton
              title={event.title}
              text={`Check out ${event.title} at FOSDEM`}
              url={`https://fosdempwa.com/event/${event.id}`}
            />
          </div>
        </PageHeader>
        <div className="w-full">
          {width < 768 ? (
            <>
              <EventPlayer event={event} isMobile />
              <EventSidebar event={event} isMobile />
            </>
          ) : (
            <ResizablePanelGroup
              direction="horizontal"
              className="min-h-[200px] rounded-lg border"
            >
              <ResizablePanel defaultSize={75}>
                <EventPlayer event={event} />
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={25}>
                <EventSidebar event={event} />
              </ResizablePanel>
            </ResizablePanelGroup>
          )}
          {event.chat && (
            <Alert className="mt-4">
              <Icons.logo className="h-4 w-4" />
              <AlertTitle>Get involved in the conversation!</AlertTitle>
              <AlertDescription>
                <a
                  href={event.chat}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  Click here to join the chat
                </a>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}
