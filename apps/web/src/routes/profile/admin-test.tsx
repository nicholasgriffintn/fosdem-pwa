import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { useProfile } from "~/hooks/use-user-me";
import { PageHeader } from "~/components/shared/PageHeader";
import { PageShell } from "~/components/shared/PageShell";
import { SectionStack } from "~/components/shared/SectionStack";
import { constants } from "~/constants";
import { generateCommonSEOTags } from "~/utils/seo-generator";
import { getSession } from "~/server/functions/session";
import { sendTestNotification } from "~/server/functions/test-notification";
import { getSubscriptions } from "~/server/functions/subscriptions";

export const Route = createFileRoute("/profile/admin-test")({
  component: AdminTestPage,
  head: () => ({
    meta: [
      ...generateCommonSEOTags({
        title: "Admin Test - Notifications | FOSDEM PWA",
        description: "Test notification system",
      })
    ],
  }),
  loader: async () => {
    const user = await getSession();
    const subscriptions = await getSubscriptions();

    return {
      user,
      subscriptions,
    };
  },
});

type NotificationType =
  | "event-reminder"
  | "daily-summary-morning"
  | "daily-summary-evening"
  | "schedule-change"
  | "room-status"
  | "recording-available";

function AdminTestPage() {
  const loaderData = Route.useLoaderData();
  const { user } = useProfile();
  const resolvedUser = user ?? loaderData.user;

  const [notificationType, setNotificationType] = useState<NotificationType>("event-reminder");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const activeSubscriptions = loaderData.subscriptions?.length ?? 0;

  const handleSendTest = async () => {
    if (!resolvedUser) return;

    setSending(true);
    setResult(null);

    try {
      const response = await sendTestNotification({
        data: {
          type: notificationType,
        }
      });

      if (response && response.success) {
        setResult({ success: true, message: response.data.message });
      } else {
        setResult({ success: false, message: response?.error ?? "Failed to send test notification" });
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error occurred"
      });
    } finally {
      setSending(false);
    }
  };

  if (!resolvedUser) {
    return (
      <PageShell>
        <PageHeader heading="Admin Test - Notifications" year={constants.DEFAULT_YEAR} />
        <SectionStack>
          <p className="text-muted-foreground">Please sign in to access this page.</p>
        </SectionStack>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader heading="Admin Test - Notifications" year={constants.DEFAULT_YEAR} />
      <SectionStack>
        <div className="max-w-2xl space-y-6">
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-xl font-semibold mb-4">Test Notification System</h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Active subscriptions: <span className="font-medium text-foreground">{activeSubscriptions}</span>
                </p>
                {activeSubscriptions === 0 && (
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    You need to enable push notifications first. Visit your profile to set them up.
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="notification-type" className="block text-sm font-medium mb-2">
                  Notification Type
                </label>
                <select
                  id="notification-type"
                  value={notificationType}
                  onChange={(e) => setNotificationType(e.target.value as NotificationType)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="event-reminder">Event Reminder</option>
                  <option value="daily-summary-morning">Daily Summary (Morning)</option>
                  <option value="daily-summary-evening">Daily Summary (Evening)</option>
                  <option value="schedule-change">Schedule Change</option>
                  <option value="room-status">Room Status Alert</option>
                  <option value="recording-available">Recording Available</option>
                </select>
              </div>

              <button
                onClick={handleSendTest}
                disabled={sending || activeSubscriptions === 0}
                className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? "Triggering..." : "Trigger Test Notification"}
              </button>

              {result && (
                <div
                  className={`rounded-md p-4 ${
                    result.success
                      ? "bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800"
                      : "bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800"
                  }`}
                >
                  <p className="text-sm font-medium">
                    {result.success ? "Success!" : "Error"}
                  </p>
                  <p className="text-sm mt-1">{result.message}</p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="text-lg font-semibold mb-3">What happens when you click?</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              {notificationType === "event-reminder" && (
                <p>Triggers the actual event reminder notification logic for events starting soon in your bookmarks</p>
              )}
              {notificationType === "daily-summary-morning" && (
                <p>Triggers the morning daily summary notification with your bookmarked events for today</p>
              )}
              {notificationType === "daily-summary-evening" && (
                <p>Triggers the evening wrap-up notification summarizing your attended events</p>
              )}
              {notificationType === "schedule-change" && (
                <p>Triggers schedule change notifications for any bookmarked events with time/room changes</p>
              )}
              {notificationType === "room-status" && (
                <p>Triggers room status notifications for bookmarked events in rooms that recently became available</p>
              )}
              {notificationType === "recording-available" && (
                <p>Triggers recording available notifications for bookmarked events with new recordings</p>
              )}
            </div>
          </div>
        </div>
      </SectionStack>
    </PageShell>
  );
}
