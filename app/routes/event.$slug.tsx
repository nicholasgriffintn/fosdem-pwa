import type { MetaFunction, LoaderFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';
import { useLoaderData, useRouteLoaderData } from '@remix-run/react';

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '~/components/ui/resizable';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { PageHeader } from '~/components/PageHeader';
import { Icons } from '~/components/Icons';
import { Button } from '~/components/ui/button';
import { toast } from '~/components/ui/use-toast';

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
  const { slug } = useLoaderData<typeof loader>();
  const { fosdem } = useRouteLoaderData('root');

  if (!fosdem) return null;

  const event = fosdem.events[slug];

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
            <Button
              variant="ghost"
              onClick={() =>
                toast({
                  title: 'Not implemented',
                  description: "We're still working on favoriting items.",
                })
              }
            >
              <Icons.star />
            </Button>
            <Button
              variant="ghost"
              onClick={() =>
                toast({
                  title: 'Not implemented',
                  description: "We're still working on sharing items.",
                })
              }
            >
              <Icons.share />
            </Button>
          </div>
        </PageHeader>
        <div className="w-full">
          <ResizablePanelGroup
            direction="horizontal"
            className="min-h-[200px] rounded-lg border"
          >
            <ResizablePanel defaultSize={75}>
              <div className="flex h-full items-center justify-center p-6 bg-muted text-muted-foreground">
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
                    <span>Sorry! The stream isn't available yet!</span>
                  </div>
                )}
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={25}>
              <div className="h-full p-6">
                {event.abstract && (
                  <div className="max-h-[500px] w-full prose prose-lg prose-indigo overflow-scroll">
                    <div dangerouslySetInnerHTML={{ __html: event.abstract }} />
                  </div>
                )}
                {event.links?.length > 0 && (
                  <div>
                    <h2>Links</h2>
                    <ul>
                      {event.links.map((link) => {
                        return (
                          <li key={link.href}>
                            <a
                              href={link.href}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {link.title}
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
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
