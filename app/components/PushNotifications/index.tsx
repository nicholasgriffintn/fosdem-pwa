import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/Spinner";
import { toast } from "~/hooks/use-toast";
import { useMutateSubscriptions } from "~/hooks/use-mutate-subscriptions";
import { useSubscriptions } from "~/hooks/use-subscriptions";
import { constants } from "~/constants";

export function PushNotifications() {
  const { subscriptions, loading: subscriptionsLoading } = useSubscriptions();
  const {
    create: createSubscription,
    delete: deleteSubscription,
    createLoading: createSubscriptionLoading,
    deleteLoading: deleteSubscriptionLoading,
  } = useMutateSubscriptions();

  const handleSubscribe = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
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

      toast({
        title: "Subscribed to notifications",
        description: "You will now receive notifications for important updates",
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

  const handleUnsubscribe = async (subscriptionId: number) => {
    try {
      await deleteSubscription({ id: subscriptionId });
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }
      toast({
        title: "Unsubscribed from notifications",
        description: "You will no longer receive notifications",
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
              <p>You are subscribed to push notifications</p>
              <div className="flex flex-col gap-2">
                {subscriptions.map((subscription) => (
                  <div key={subscription.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <span>Subscription created at {new Date(subscription.created_at).toLocaleString()}</span>
                    <Button
                      variant="destructive"
                      onClick={() => handleUnsubscribe(subscription.id)}
                      disabled={deleteSubscriptionLoading}
                    >
                      {deleteSubscriptionLoading ? <Spinner className="h-4 w-4" /> : "Unsubscribe"}
                    </Button>
                  </div>
                ))}
              </div>
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