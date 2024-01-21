import type { MetaFunction } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';
import { useState, useEffect } from 'react';
import {
  getPushSubscriptionStatus,
  subscribeToPush,
  getSubscriptionData,
} from '@remix-pwa/push/worker';

import { getUserFromSession } from '~/services/auth';
import { getFavouritesData } from '~/services/requests';
import { BookmarksList } from '~/components/BookmarksList';
import { Button } from '~/components/ui/button';
import { PageHeader } from '~/components/PageHeader';
import { Alert, AlertTitle, AlertDescription } from '~/components/ui/alert';
import { Icons } from '~/components/Icons';

export const meta: MetaFunction = () => {
  return [
    { title: 'Bookmarks | FOSDEM 2024' },
    {
      name: 'description',
      content: 'Your favourited bookmarks from FOSDEM 2024',
    },
  ];
};

export const loader = async ({ request, context }) => {
  const cookie = request.headers.get('Cookie') || '';
  const session = await context.sessionStorage.getSession(cookie);
  const userAgent = request.headers.get('User-Agent') || '';

  const user = await getUserFromSession(session, userAgent, context);
  const userDetails = await user?.getUser();

  const favourites = await getFavouritesData(userDetails?.id, context);

  return json({ user: userDetails || {}, bookmarks: favourites || [] });
};

export default function Bookmarks() {
  const data = useLoaderData<typeof loader>();

  const [subscriptionLoaded, setSubscriptionLoaded] = useState(false);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    if (!subscriptionLoaded) {
      getSubscriptionData().then((subscription) => {
        setSubscription(subscription);
        setSubscriptionLoaded(true);
      });
    }
  }, []);

  const onSubscribe = async () => {
    const PUBLIC_KEY =
      'BHdNRbVHaSS77klpV70lO7ZbS1MGbYhSpKGT6_m-aB_kwEB8t9R9pLWwZJcjUKTGzbjw4Uy7CEWt2uZU5aTn6OA';
    const subscription = await subscribeToPush(
      PUBLIC_KEY,
      '/push',
      'subscribe',
      {
        user: data.user,
      }
    );
    setSubscription(subscription);
  };

  console.log(data, subscription);

  return (
    <div className="min-h-screen">
      <div className="relative py-6 lg:py-10">
        <PageHeader heading="Bookmarks (WIP)" />
        {data?.bookmarks?.length ? (
          <>
            {subscriptionLoaded && !subscription && (
              <div className="mb-6">
                <Alert>
                  <Icons.megaphone className="h-4 w-4" />
                  <AlertTitle>Heads up!</AlertTitle>
                  <AlertDescription>
                    <p className="mb-2">
                      You can subscribe to push notifications to get notified
                      when your bookmarked talks are about to start. Click the
                      button below to get started!
                    </p>
                    <Button variant="outline" onClick={onSubscribe}>
                      Enable Notifications
                    </Button>
                  </AlertDescription>
                </Alert>
              </div>
            )}
            <BookmarksList bookmarks={data.bookmarks} />
          </>
        ) : (
          <div className="flex flex-col h-full">
            <h1 className="text-2xl font-bold">You have no bookmarks</h1>
            <p>You can bookmark talks from the schedule page</p>
          </div>
        )}
      </div>
    </div>
  );
}
