import { createServerFn } from "@tanstack/react-start";

import { getAuthUser } from "~/server/lib/auth-middleware";
import { ok, err, type Result } from "~/server/lib/result";
import {
  findNotificationPreferenceByUser,
  upsertNotificationPreference,
  getDefaultNotificationPreference,
} from "~/server/repositories/notification-preference-repository";
import type { NotificationPreference } from "~/server/db/schema";

export const getNotificationPreferences = createServerFn({
  method: "GET",
}).handler(async (): Promise<NotificationPreference | null> => {
  const user = await getAuthUser();
  if (!user) {
    return null;
  }

  const preferences = await findNotificationPreferenceByUser(user.id);
  if (!preferences) {
    return getDefaultNotificationPreference();
  }

  return preferences;
});

export type NotificationPreferenceUpdate = {
  reminder_minutes_before?: number;
  event_reminders?: boolean;
  schedule_changes?: boolean;
  room_status_alerts?: boolean;
  recording_available?: boolean;
  daily_summary?: boolean;
  notify_low_priority?: boolean;
};

export const updateNotificationPreferences = createServerFn({
  method: "POST",
})
  .inputValidator((data: NotificationPreferenceUpdate) => data)
  .handler(async (ctx): Promise<Result<NotificationPreference> | null> => {
    const user = await getAuthUser();
    if (!user) {
      return null;
    }

    try {
      const updated = await upsertNotificationPreference(user.id, ctx.data);
      return ok(updated);
    } catch (error) {
      console.error("Failed to update notification preferences:", error);
      return err("Failed to update notification preferences");
    }
  });
