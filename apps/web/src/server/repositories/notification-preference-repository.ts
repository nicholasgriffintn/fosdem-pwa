import { eq } from "drizzle-orm";

import { db } from "~/server/db";
import {
  notificationPreference as notificationPreferenceTable,
  type NotificationPreference,
} from "~/server/db/schema";

export async function findNotificationPreferenceByUser(
  userId: number,
): Promise<NotificationPreference | undefined> {
  return db.query.notificationPreference.findFirst({
    where: eq(notificationPreferenceTable.user_id, userId),
  });
}

export async function upsertNotificationPreference(
  userId: number,
  preferences: Partial<Omit<NotificationPreference, "id" | "user_id" | "created_at" | "updated_at">>,
): Promise<NotificationPreference> {
  const existing = await findNotificationPreferenceByUser(userId);

  if (existing) {
    const [updated] = await db
      .update(notificationPreferenceTable)
      .set(preferences)
      .where(eq(notificationPreferenceTable.user_id, userId))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(notificationPreferenceTable)
    .values({
      user_id: userId,
      ...preferences,
    })
    .returning();

  return created;
}

export function getDefaultNotificationPreference(): NotificationPreference {
  return {
    id: 0,
    user_id: 0,
    reminder_minutes_before: 15,
    event_reminders: true,
    schedule_changes: true,
    room_status_alerts: true,
    recording_available: false,
    daily_summary: true,
    notify_low_priority: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
