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

/**
 * Allow-list of columns a caller may set on their own preference row.
 *
 * The server function's validator is a compile-time-only pass-through, so an
 * arbitrary JSON body reaches this layer at runtime. Spreading it directly
 * would let a caller supply `user_id` (or `id`) and write another user's row.
 */
const EDITABLE_PREFERENCE_FIELDS = [
  "event_reminders",
  "reminder_minutes_before",
  "schedule_changes",
  "room_status_alerts",
  "recording_available",
  "daily_summary",
  "notify_low_priority",
] as const;

type EditablePreferences = Partial<
  Pick<NotificationPreference, (typeof EDITABLE_PREFERENCE_FIELDS)[number]>
>;

export function pickPreferenceFields(preferences: EditablePreferences): EditablePreferences {
  const picked: EditablePreferences = {};

  for (const field of EDITABLE_PREFERENCE_FIELDS) {
    if (preferences[field] !== undefined) {
      (picked as Record<string, unknown>)[field] = preferences[field];
    }
  }

  return picked;
}

export async function upsertNotificationPreference(
  userId: number,
  preferences: Partial<Omit<NotificationPreference, "id" | "user_id" | "created_at" | "updated_at">>,
): Promise<NotificationPreference> {
  const existing = await findNotificationPreferenceByUser(userId);

  if (existing) {
    const [updated] = await db
      .update(notificationPreferenceTable)
      .set(pickPreferenceFields(preferences))
      .where(eq(notificationPreferenceTable.user_id, userId))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(notificationPreferenceTable)
    .values({
      ...pickPreferenceFields(preferences),
      user_id: userId,
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
