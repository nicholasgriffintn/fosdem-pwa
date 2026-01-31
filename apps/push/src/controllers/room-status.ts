import type { ExecutionContext } from "@cloudflare/workers-types";

import { constants } from "../constants";
import { getFosdemData, getCurrentDay } from "../lib/fosdem-data";
import { getBookmarksByUserIds, enrichBookmarks, getBookmarksForDay } from "../lib/bookmarks";
import { getApplicationKeys, sendNotification } from "../lib/notifications";
import { resolveNotificationPreference } from "../lib/notification-preferences";
import { createBrusselsDate } from "../utils/date";
import type { Env, NotificationPayload } from "../types";

const ROOMS_API = "https://api.fosdem.org/roomstatus/v1/listrooms";
const FETCH_TIMEOUT_MS = 8000;
const DOMAIN = "fosdempwa.com";

interface RoomStatusResponse {
  roomname: string;
  state: string;
}

type RoomTrend = "filling" | "emptying" | "stable" | "unknown";
type RawRoomStatus = {
  roomname?: unknown;
  state?: unknown;
};

function normalizeRoomStatus(raw: RawRoomStatus): RoomStatusResponse | null {
  if (typeof raw.roomname !== "string" || raw.roomname.trim() === "") {
    return null;
  }

  if (raw.state === undefined || raw.state === null) {
    return null;
  }

  return {
    roomname: raw.roomname,
    state: String(raw.state),
  };
}

function extractRoomStatuses(data: unknown): RoomStatusResponse[] {
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((record) => normalizeRoomStatus(record as RawRoomStatus))
    .filter((record): record is RoomStatusResponse => Boolean(record));
}

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

    const data = await response.json();
    return extractRoomStatuses(data);
  } finally {
    clearTimeout(timeout);
  }
}

async function getLatestRoomStates(
  roomNames: string[],
  env: Env,
): Promise<Map<string, string>> {
  const latest = new Map<string, string>();
  if (!roomNames.length) {
    return latest;
  }

  const placeholders = roomNames.map(() => "?").join(", ");
  const result = await env.DB.prepare(
    `SELECT room_name, state
     FROM room_status_latest
     WHERE year = ? AND room_name IN (${placeholders})`,
  )
    .bind(constants.YEAR, ...roomNames)
    .all();

  if (!result.success || !result.results) {
    return latest;
  }

  for (const row of result.results as Array<{ room_name: string; state: string }>) {
    latest.set(row.room_name, row.state);
  }

  return latest;
}

async function storeRoomStatuses(
  statuses: RoomStatusResponse[],
  env: Env,
): Promise<void> {
  if (!statuses.length) return;

  const latestStates = await getLatestRoomStates(
    statuses.map((status) => status.roomname),
    env,
  );
  const changedStatuses = statuses.filter(
    (status) => latestStates.get(status.roomname) !== status.state,
  );

  if (!changedStatuses.length) {
    console.log("No room status changes detected");
    return;
  }

  const statements = changedStatuses.flatMap((status) => [
    env.DB.prepare(
      "INSERT INTO room_status_history (room_name, state, year, recorded_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)",
    ).bind(status.roomname, status.state, constants.YEAR),
    env.DB.prepare(
      `INSERT INTO room_status_latest (room_name, year, state, updated_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(room_name, year) DO UPDATE SET
         state = excluded.state,
         updated_at = CURRENT_TIMESTAMP`,
    ).bind(status.roomname, constants.YEAR, status.state),
  ]);

  await env.DB.batch(statements);
}

function calculateRoomTrend(history: Array<{ state: string }>): RoomTrend {
  if (history.length < 2) {
    return "unknown";
  }

  const fullCount = history.filter((h) => h.state === "1").length;
  const total = history.length;

  if (fullCount / total > 0.6) {
    const recentHalf = history.slice(0, Math.floor(total / 2));
    const olderHalf = history.slice(Math.floor(total / 2));
    const recentFullRate =
      recentHalf.filter((h) => h.state === "1").length / recentHalf.length;
    const olderFullRate =
      olderHalf.filter((h) => h.state === "1").length / olderHalf.length;

    if (recentFullRate > olderFullRate) {
      return "filling";
    }
  }

  const availableCount = history.filter((h) => h.state !== "1").length;
  if (availableCount / total > 0.6) {
    const recentHalf = history.slice(0, Math.floor(total / 2));
    const olderHalf = history.slice(Math.floor(total / 2));
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

async function getRoomTrends(
  roomNames: string[],
  env: Env,
): Promise<Map<string, RoomTrend>> {
  const trends = new Map<string, RoomTrend>();
  if (!roomNames.length) {
    return trends;
  }

  const placeholders = roomNames.map(() => "?").join(", ");
  const history = await env.DB.prepare(
    `SELECT room_name, state, recorded_at
     FROM room_status_history
     WHERE year = ? AND recorded_at > datetime('now', '-30 minutes')
       AND room_name IN (${placeholders})
     ORDER BY recorded_at DESC`,
  )
    .bind(constants.YEAR, ...roomNames)
    .all();

  if (!history.success || !history.results) {
    for (const roomName of roomNames) {
      trends.set(roomName, "unknown");
    }
    return trends;
  }

  const grouped = new Map<string, Array<{ state: string }>>();
  for (const row of history.results as Array<{ room_name: string; state: string }>) {
    if (!grouped.has(row.room_name)) {
      grouped.set(row.room_name, []);
    }
    grouped.get(row.room_name)?.push({ state: row.state });
  }

  for (const roomName of roomNames) {
    const roomHistory = grouped.get(roomName) ?? [];
    trends.set(roomName, calculateRoomTrend(roomHistory));
  }

  return trends;
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

export async function pollAndStoreRoomStatus(env: Env): Promise<RoomStatusResponse[]> {
	try {
		const statuses = await fetchRoomStatuses();
		await storeRoomStatuses(statuses, env);
		console.log(`Stored ${statuses.length} room statuses`);
		return statuses;
	} catch (error) {
		console.error("Failed to poll room status:", error);
		return [];
	}
}

export async function triggerRoomStatusNotifications(
  event: { cron: string },
  env: Env,
  ctx: ExecutionContext,
  queueMode = false,
  dayOverride?: string,
  prefetchedStatuses?: RoomStatusResponse[],
): Promise<void> {
  const currentDay = getCurrentDay();
  const whichDay = dayOverride ?? currentDay;
  if (!whichDay) {
    console.log("FOSDEM is not running today; skipping room status notifications");
    return;
  }

	const currentStatuses = prefetchedStatuses?.length
		? prefetchedStatuses
		: await pollAndStoreRoomStatus(env);
	if (!currentStatuses.length) {
		console.log("No room statuses available");
		return;
	}
	const statusMap = new Map(
		currentStatuses.map((s) => [s.roomname, s.state]),
	);

  const roomNames = [...statusMap.keys()];
  const trends = await getRoomTrends(roomNames, env);
  const fillingRooms = roomNames.filter(
    (roomName) => trends.get(roomName) === "filling",
  );

	if (!fillingRooms.length) {
		console.log("No rooms are filling up");
		return;
	}

	const fillingRoomSet = new Set(fillingRooms);
	console.log(`Rooms filling up: ${fillingRooms.join(", ")}`);

  const fosdemData = await getFosdemData();
  const keys = await getApplicationKeys(env);

  const subscriptions = await env.DB.prepare(
    `SELECT s.user_id, s.endpoint, s.auth, s.p256dh,
      p.reminder_minutes_before, p.event_reminders, p.schedule_changes, p.room_status_alerts,
      p.recording_available, p.daily_summary, p.notify_low_priority
     FROM subscription s
     LEFT JOIN notification_preference p ON p.user_id = s.user_id`,
  ).run();

  if (!subscriptions.success || !subscriptions.results?.length) {
    console.log("No subscriptions found for room status notifications");
    return;
  }

  const subscriptionRows = subscriptions.results as Array<Record<string, unknown>>;
  const subscriptionEntries = subscriptionRows.map((subscription) => ({
    subscription: {
      user_id: subscription.user_id as string,
      endpoint: subscription.endpoint as string,
      auth: subscription.auth as string,
      p256dh: subscription.p256dh as string,
    },
    prefs: resolveNotificationPreference(subscription as any),
  }));

  const usersNeedingBookmarks = subscriptionEntries
    .filter(({ prefs }) => prefs.room_status_alerts)
    .map(({ subscription }) => subscription.user_id);
  const bookmarksByUser = usersNeedingBookmarks.length
    ? await getBookmarksByUserIds(usersNeedingBookmarks, env, {
        includeSent: true,
      })
    : new Map();

  let notificationsSent = 0;

  for (const { subscription, prefs } of subscriptionEntries) {
    if (!prefs.room_status_alerts) {
      continue;
    }

    const bookmarks = bookmarksByUser.get(subscription.user_id) ?? [];

    const filteredBookmarks = prefs.notify_low_priority
      ? bookmarks
      : bookmarks.filter((bookmark) => Number(bookmark.priority) <= 1);

    if (!filteredBookmarks.length) continue;

    const enrichedBookmarks = enrichBookmarks(filteredBookmarks, fosdemData.events);
    const todayBookmarks = getBookmarksForDay(enrichedBookmarks, whichDay);

	const brusselsNow = createBrusselsDate();
	const year = brusselsNow.getUTCFullYear();
	const month = brusselsNow.getUTCMonth();
	const day = brusselsNow.getUTCDate();

	for (const bookmark of todayBookmarks) {
		if (!fillingRoomSet.has(bookmark.room)) continue;

		const [hours, minutes] = bookmark.startTime.split(":").map(Number);
		if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
			continue;
		}
		const eventTime = new Date(Date.UTC(year, month, day, hours, minutes, 0));

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
              subscription,
              notification,
              bookmarkId: `${bookmark.id}-room-status`,
              shouldMarkSent: false,
            });
          } else {
            await sendNotification(subscription, notification, keys, env);
          }
          notificationsSent++;
        } catch (error) {
          console.error(
            `Failed to send room status notification to ${subscription.user_id}:`,
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
