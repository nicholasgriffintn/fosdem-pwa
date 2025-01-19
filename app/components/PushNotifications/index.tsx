"use client";

import { useEffect, useState } from "react";

import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/Spinner";
import { toast } from "~/hooks/use-toast";
import { useMutateSubscriptions } from "~/hooks/use-mutate-subscriptions";
import { useSubscriptions } from "~/hooks/use-subscriptions";
import { constants } from "~/constants";

export function PushNotifications() {
  const { subscriptions, loading: subscriptionsLoading } = useSubscriptions();
  const [currentEndpoint, setCurrentEndpoint] = useState<string | null>(null);
  const {
    create: createSubscription,
    delete: deleteSubscription,
    createLoading: createSubscriptionLoading,
    deleteLoading: deleteSubscriptionLoading,
  } = useMutateSubscriptions();

  useEffect(() => {
    const checkCurrentSubscription = async () => {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        setCurrentEndpoint(subscription.endpoint);
      }
    };
    checkCurrentSubscription();
  }, []);

  const handleSubscribe = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;

      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        const isAlreadySubscribed = subscriptions?.some(
          sub => sub.endpoint === existingSubscription.endpoint
        );

        if (isAlreadySubscribed) {
          toast({
            title: "Already subscribed",
            description: "This device is already subscribed to notifications",
          });
          return;
        }
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: constants.VAPID_PUBLIC_KEY
      });

      const subscriptionJSON = subscription.toJSON() as {
        endpoint: string;
        keys: {
          auth: string;
          p256dh: string;
        };
      };

      const { endpoint, keys: { auth, p256dh } } = subscriptionJSON;

      if (!endpoint || !auth || !p256dh) {
        throw new Error('Failed to get subscription details');
      }

      await createSubscription({ endpoint, auth, p256dh });
      setCurrentEndpoint(endpoint);

      toast({
        title: "Subscribed to notifications",
        description: "This device will now receive notifications for schedule updates",
      });
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      toast({
        title: "Failed to subscribe",
        description: "Please check if notifications are enabled in your browser",
        variant: "destructive",
      });
    }
  };

  const handleUnsubscribe = async (subscriptionId: number, endpoint: string) => {
    try {
      await deleteSubscription({ id: subscriptionId });

      if (endpoint === currentEndpoint) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          setCurrentEndpoint(null);
        }
      }

      toast({
        title: "Unsubscribed from notifications",
        description: "This device will no longer receive notifications",
      });
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      toast({
        title: "Failed to unsubscribe",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Push Notifications</h2>
      {subscriptionsLoading ? (
        <div className="flex items-center justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      ) : (
        <>
          {subscriptions && subscriptions.length > 0 ? (
            <div className="space-y-4">
              <p>Your subscribed devices:</p>
              <div className="flex flex-col gap-2">
                {subscriptions.map((subscription) => (
                  <div key={subscription.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex flex-col">
                      <span>Subscription created at {new Date(subscription.created_at).toLocaleString()}</span>
                      {subscription.endpoint === currentEndpoint && (
                        <span className="text-sm text-muted-foreground">(Current device)</span>
                      )}
                    </div>
                    <Button
                      variant="destructive"
                      onClick={() => handleUnsubscribe(subscription.id, subscription.endpoint)}
                      disabled={deleteSubscriptionLoading}
                    >
                      {deleteSubscriptionLoading ? <Spinner className="h-4 w-4" /> : "Unsubscribe"}
                    </Button>
                  </div>
                ))}
              </div>
              {!currentEndpoint && (
                <div className="flex items-center justify-between py-4 mt-4 border-t">
                  <div className="space-y-0.5">
                    <Label htmlFor="push-notifications">Add this device</Label>
                    <p className="text-sm text-muted-foreground">
                      Subscribe this device to receive notifications
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleSubscribe}
                    disabled={createSubscriptionLoading}
                  >
                    {createSubscriptionLoading ? <Spinner className="h-4 w-4" /> : "Subscribe"}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between py-4">
              <div className="space-y-0.5">
                <Label htmlFor="push-notifications">Subscribe to push notifications</Label>
                <p className="text-sm text-muted-foreground">
                  You'll receive notifications for when events from your schedule are starting.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleSubscribe}
                disabled={createSubscriptionLoading}
              >
                {createSubscriptionLoading ? <Spinner className="h-4 w-4" /> : "Subscribe"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
} 