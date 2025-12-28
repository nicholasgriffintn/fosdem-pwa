import type { ExecutionContext } from "@cloudflare/workers-types";

import { constants } from "../constants";
import { getFosdemData } from "../lib/fosdem-data";
import { getUserBookmarks } from "../lib/bookmarks";
import { getApplicationKeys, sendNotification } from "../lib/notifications";
import { getUserNotificationPreference } from "../lib/notification-preferences";
import type { Env, Subscription, NotificationPayload, FosdemEvent } from "../types";

const DOMAIN = "fosdempwa.com";

interface RecordingSnapshotRow {
  slug: string;
  year: number;
  has_recording: boolean;
  recording_url: string | null;
  notified_at: string | null;
}

function hasVideoRecording(event: FosdemEvent): { hasRecording: boolean; url?: string } {
  const videoLink = event.links?.find((link) =>
    link.type?.startsWith("video/"),
  );

  return {
    hasRecording: !!videoLink,
    url: videoLink?.href,
  };
}

async function loadRecordingSnapshots(env: Env): Promise<RecordingSnapshotRow[]> {
  const result = await env.DB.prepare(
    "SELECT slug, year, has_recording, recording_url, notified_at FROM recording_snapshot WHERE year = ?",
  )
    .bind(constants.YEAR)
    .run();

  return (result.results ?? []) as unknown as RecordingSnapshotRow[];
}

async function upsertRecordingSnapshot(
  slug: string,
  hasRecording: boolean,
  recordingUrl: string | undefined,
  env: Env,
): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO recording_snapshot (slug, year, has_recording, recording_url, updated_at) 
     VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(slug, year) DO UPDATE SET 
       has_recording = excluded.has_recording,
       recording_url = excluded.recording_url,
       updated_at = CURRENT_TIMESTAMP`,
  )
    .bind(slug, constants.YEAR, hasRecording ? 1 : 0, recordingUrl ?? null)
    .run();
}

async function markRecordingNotified(slug: string, env: Env): Promise<void> {
  await env.DB.prepare(
    "UPDATE recording_snapshot SET notified_at = CURRENT_TIMESTAMP WHERE slug = ? AND year = ?",
  )
    .bind(slug, constants.YEAR)
    .run();
}

async function isEventMissed(
  bookmarkId: string,
  env: Env,
): Promise<boolean> {
  const result = await env.DB.prepare(
    `SELECT attended, watch_status 
     FROM bookmark 
     WHERE id = ?`,
  )
    .bind(bookmarkId)
    .first();

  if (!result) return false;

  const notAttended = !result.attended;
  const notWatched = result.watch_status !== "watched";
  return notAttended && notWatched;
}

function createRecordingAvailableNotification(
  eventTitle: string,
  eventSlug: string,
): NotificationPayload {
  return {
    title: "Recording now available",
    body: `The recording for "${eventTitle}" is now available to watch.`,
    url: `https://${DOMAIN}/event/${eventSlug}?year=${constants.YEAR}`,
  };
}

export async function triggerRecordingNotifications(
  event: { cron: string },
  env: Env,
  ctx: ExecutionContext,
  queueMode = false,
): Promise<void> {
  const fosdemData = await getFosdemData();
  const existingSnapshots = await loadRecordingSnapshots(env);
  const snapshotMap = new Map(
    existingSnapshots.map((s) => [s.slug, s]),
  );

  const newRecordings: Array<{ slug: string; title: string; url?: string }> = [];

  for (const [slug, event] of Object.entries(fosdemData.events)) {
    const { hasRecording, url } = hasVideoRecording(event);
    const existingSnapshot = snapshotMap.get(slug);

    await upsertRecordingSnapshot(slug, hasRecording, url, env);

    if (
      hasRecording &&
      (!existingSnapshot || !existingSnapshot.has_recording) &&
      (!existingSnapshot || !existingSnapshot.notified_at)
    ) {
      newRecordings.push({ slug, title: event.title, url });
    }
  }

  if (!newRecordings.length) {
    console.log("No new recordings found");
    return;
  }

  console.log(`Found ${newRecordings.length} new recordings`);

  const keys = await getApplicationKeys(env);

  const subscriptions = await env.DB.prepare(
    "SELECT user_id, endpoint, auth, p256dh FROM subscription",
  ).run();

  if (!subscriptions.success || !subscriptions.results?.length) {
    console.log("No subscriptions found for recording notifications");
    return;
  }

  let notificationsSent = 0;

  for (const subscription of subscriptions.results) {
    const typedSubscription: Subscription = {
      user_id: subscription.user_id as string,
      endpoint: subscription.endpoint as string,
      auth: subscription.auth as string,
      p256dh: subscription.p256dh as string,
    };

    const prefs = await getUserNotificationPreference(
      typedSubscription.user_id,
      env,
    );

    if (!prefs.recording_available) {
      continue;
    }

    const bookmarks = await getUserBookmarks(typedSubscription.user_id, env, {
      includeSent: true,
    });

    const filteredBookmarks = prefs.notify_low_priority
      ? bookmarks
      : bookmarks.filter((bookmark) => Number(bookmark.priority) <= 1);

    if (!filteredBookmarks.length) continue;

    for (const recording of newRecordings) {
      const bookmark = filteredBookmarks.find((b) => b.slug === recording.slug);
      if (!bookmark) continue;

      const missed = await isEventMissed(bookmark.id, env);
      if (!missed) continue;

      const notification = createRecordingAvailableNotification(
        recording.title,
        recording.slug,
      );

      try {
        if (queueMode) {
          await env.NOTIFICATION_QUEUE.send({
            subscription: typedSubscription,
            notification,
            bookmarkId: `${bookmark.id}-recording`,
            shouldMarkSent: false,
          });
        } else {
          await sendNotification(typedSubscription, notification, keys, env);
        }
        notificationsSent++;
      } catch (error) {
        console.error(
          `Failed to send recording notification to ${typedSubscription.user_id}:`,
          error,
        );
      }
    }
  }

  for (const recording of newRecordings) {
    await markRecordingNotified(recording.slug, env);
  }

  console.log(`Sent ${notificationsSent} recording notifications`);
}
