import type { ExecutionContext } from "@cloudflare/workers-types";

import { constants } from "../constants";
import { getFosdemData, getCurrentDay } from "../lib/fosdem-data";
import { getUserBookmarks, enrichBookmarks, getBookmarksForDay } from "../lib/bookmarks";
import { getApplicationKeys, sendNotification } from "../lib/notifications";
import { getUserNotificationPreference } from "../lib/notification-preferences";
import { bookmarkNotificationsEnabled } from "../utils/config";
import type { Env, Subscription, NotificationPayload } from "../types";

const ROOMS_API = "https://api.fosdem.org/roomstatus/v1/listrooms";
const FETCH_TIMEOUT_MS = 8000;
const DOMAIN = "fosdempwa.com";

interface RoomStatusResponse {
  roomname: string;
  state: string;
}

type RoomTrend = "filling" | "emptying" | "stable" | "unknown";

async function fetchRoomStatuses(): Promise<RoomStatusResponse[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(ROOMS_API, {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch room status: ${response.status}`);
    }

    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function storeRoomStatuses(
  statuses: RoomStatusResponse[],
  env: Env,
): Promise<void> {
  if (!statuses.length) return;

  const statements = statuses.map((status) =>
    env.DB.prepare(
      "INSERT INTO room_status_history (room_name, state, year, recorded_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)",
    ).bind(status.roomname, status.state, constants.YEAR),
  );

  await env.DB.batch(statements);
}

async function getRoomTrend(roomName: string, env: Env): Promise<RoomTrend> {
  const history = await env.DB.prepare(
    `SELECT state, recorded_at 
     FROM room_status_history 
     WHERE room_name = ? AND year = ? AND recorded_at > datetime('now', '-30 minutes')
     ORDER BY recorded_at DESC`,
  )
    .bind(roomName, constants.YEAR)
    .all();

  if (!history.success || !history.results || history.results.length < 2) {
    return "unknown";
  }

  const results = history.results as Array<{ state: string; recorded_at: string }>;
  const fullCount = results.filter((h) => h.state === "1").length;
  const total = results.length;

  if (fullCount / total > 0.6) {
    const recentHalf = results.slice(0, Math.floor(total / 2));
    const olderHalf = results.slice(Math.floor(total / 2));
    const recentFullRate =
      recentHalf.filter((h) => h.state === "1").length / recentHalf.length;
    const olderFullRate =
      olderHalf.filter((h) => h.state === "1").length / olderHalf.length;

    if (recentFullRate > olderFullRate) {
      return "filling";
    }
  }

  const availableCount = results.filter((h) => h.state !== "1").length;
  if (availableCount / total > 0.6) {
    const recentHalf = results.slice(0, Math.floor(total / 2));
    const olderHalf = results.slice(Math.floor(total / 2));
    const recentAvailableRate =
      recentHalf.filter((h) => h.state !== "1").length / recentHalf.length;
    const olderAvailableRate =
      olderHalf.filter((h) => h.state !== "1").length / olderHalf.length;

    if (recentAvailableRate > olderAvailableRate) {
      return "emptying";
    }
  }

  return "stable";
}

function createRoomFillingNotification(
  eventTitle: string,
  room: string,
  startTime: string,
  eventSlug: string,
): NotificationPayload {
  return {
    title: "Room filling up",
    body: `${room} is filling up! Your event "${eventTitle}" starts at ${startTime}. Consider arriving early.`,
    url: `https://${DOMAIN}/event/${eventSlug}?year=${constants.YEAR}`,
  };
}

export async function pollAndStoreRoomStatus(env: Env): Promise<void> {
  try {
    const statuses = await fetchRoomStatuses();
    await storeRoomStatuses(statuses, env);
    console.log(`Stored ${statuses.length} room statuses`);
  } catch (error) {
    console.error("Failed to poll room status:", error);
  }
}

export async function triggerRoomStatusNotifications(
  event: { cron: string },
  env: Env,
  ctx: ExecutionContext,
  queueMode = false,
): Promise<void> {
  if (!bookmarkNotificationsEnabled(env)) {
    console.log("Bookmark notifications disabled; skipping room status notifications");
    return;
  }

  const whichDay = getCurrentDay();
  if (!whichDay) {
    console.log("FOSDEM is not running today; skipping room status notifications");
    return;
  }

  await pollAndStoreRoomStatus(env);

  const currentStatuses = await fetchRoomStatuses();
  const statusMap = new Map(
    currentStatuses.map((s) => [s.roomname, s.state]),
  );

  const fillingRooms: string[] = [];
  for (const [roomName] of statusMap) {
    const trend = await getRoomTrend(roomName, env);
    if (trend === "filling") {
      fillingRooms.push(roomName);
    }
  }

  if (!fillingRooms.length) {
    console.log("No rooms are filling up");
    return;
  }

  console.log(`Rooms filling up: ${fillingRooms.join(", ")}`);

  const fosdemData = await getFosdemData();
  const keys = await getApplicationKeys(env);

  const subscriptions = await env.DB.prepare(
    "SELECT user_id, endpoint, auth, p256dh FROM subscription",
  ).run();

  if (!subscriptions.success || !subscriptions.results?.length) {
    console.log("No subscriptions found for room status notifications");
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

    if (!prefs.room_status_alerts) {
      continue;
    }

    const bookmarks = await getUserBookmarks(typedSubscription.user_id, env, {
      includeSent: true,
    });

    const filteredBookmarks = prefs.notify_low_priority
      ? bookmarks
      : bookmarks.filter((bookmark) => Number(bookmark.priority) <= 1);

    if (!filteredBookmarks.length) continue;

    const enrichedBookmarks = enrichBookmarks(filteredBookmarks, fosdemData.events);
    const todayBookmarks = getBookmarksForDay(enrichedBookmarks, whichDay);

    const now = new Date();
    const brusselsNow = new Date(
      now.toLocaleString("en-US", { timeZone: "Europe/Brussels" }),
    );

    for (const bookmark of todayBookmarks) {
      if (!fillingRooms.includes(bookmark.room)) continue;

      const [hours, minutes] = bookmark.startTime.split(":").map(Number);
      const eventTime = new Date(brusselsNow);
      eventTime.setHours(hours, minutes, 0, 0);

      const minutesUntilStart =
        (eventTime.getTime() - brusselsNow.getTime()) / (1000 * 60);

      if (minutesUntilStart > 20 && minutesUntilStart <= 45) {
        const notification = createRoomFillingNotification(
          bookmark.title,
          bookmark.room,
          bookmark.startTime,
          bookmark.slug,
        );

        try {
          if (queueMode) {
            await env.NOTIFICATION_QUEUE.send({
              subscription: typedSubscription,
              notification,
              bookmarkId: `${bookmark.id}-room-status`,
              shouldMarkSent: false,
            });
          } else {
            await sendNotification(typedSubscription, notification, keys, env);
          }
          notificationsSent++;
        } catch (error) {
          console.error(
            `Failed to send room status notification to ${typedSubscription.user_id}:`,
            error,
          );
        }
      }
    }
  }

  console.log(`Sent ${notificationsSent} room status notifications`);
}

export async function cleanupOldRoomStatus(env: Env): Promise<void> {
  try {
    await env.DB.prepare(
      "DELETE FROM room_status_history WHERE recorded_at < datetime('now', '-7 days')",
    ).run();
    console.log("Cleaned up old room status history");
  } catch (error) {
    console.error("Failed to cleanup old room status:", error);
  }
}
