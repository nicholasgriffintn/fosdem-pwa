"use client";

import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";

import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { Select } from "~/components/ui/select";
import { toast } from "~/hooks/use-toast";
import { LoadingState } from "~/components/shared/LoadingState";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferenceUpdate,
} from "~/server/functions/notification-preferences";
import type { NotificationPreference } from "~/server/db/schema";

const REMINDER_OPTIONS = [
  { value: "5", label: "5 minutes before" },
  { value: "10", label: "10 minutes before" },
  { value: "15", label: "15 minutes before" },
  { value: "30", label: "30 minutes before" },
];

export function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreference | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPreferences = useServerFn(getNotificationPreferences);
  const savePreferences = useServerFn(updateNotificationPreferences);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const prefs = await fetchPreferences();
        if (mounted && prefs) {
          setPreferences(prefs);
        }
      } catch (error) {
        console.error("Failed to load notification preferences:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [fetchPreferences]);

  const handleUpdate = useCallback(
    async (updates: NotificationPreferenceUpdate) => {
      if (!preferences) return;

      setSaving(true);
      try {
        const result = await savePreferences({ data: updates });
        if (result && "data" in result) {
          setPreferences(result.data);
          toast({
            title: "Preferences saved",
            description: "Your notification preferences have been updated.",
          });
        }
      } catch (error) {
        console.error("Failed to save notification preferences:", error);
        toast({
          title: "Failed to save",
          description: "Please try again.",
          variant: "destructive",
        });
      } finally {
        setSaving(false);
      }
    },
    [preferences, savePreferences],
  );

  const handleToggle = useCallback(
    (key: keyof NotificationPreferenceUpdate) => async (checked: boolean) => {
      await handleUpdate({ [key]: checked } as NotificationPreferenceUpdate);
    },
    [handleUpdate],
  );

  const handleReminderChange = useCallback(
    async (value: string) => {
      await handleUpdate({ reminder_minutes_before: parseInt(value, 10) });
    },
    [handleUpdate],
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">
          Notification Preferences
        </h3>
        <LoadingState
          type="spinner"
          message="Loading preferences..."
          variant="centered"
        />
      </div>
    );
  }

  if (!preferences) {
    return null;
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-foreground">
        Notification Preferences
      </h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="reminder-time">Reminder timing</Label>
            <p className="text-sm text-muted-foreground">
              How early to notify you before events start
            </p>
          </div>
          <Select
            options={REMINDER_OPTIONS}
            value={String(preferences.reminder_minutes_before)}
            onValueChange={handleReminderChange}
            disabled={saving}
            className="w-[180px]"
          />
        </div>

        <div className="border-t pt-4 space-y-4">
          <h4 className="text-sm font-medium text-foreground">
            Notification Types
          </h4>

          <PreferenceToggle
            id="event-reminders"
            label="Event reminders"
            description="Notify when bookmarked events are about to start"
            checked={preferences.event_reminders ?? true}
            onCheckedChange={handleToggle("event_reminders")}
            disabled={saving}
          />

          <PreferenceToggle
            id="schedule-changes"
            label="Schedule changes"
            description="Notify when bookmarked events change time or room"
            checked={preferences.schedule_changes ?? true}
            onCheckedChange={handleToggle("schedule_changes")}
            disabled={saving}
          />

          <PreferenceToggle
            id="room-status"
            label="Room status alerts"
            description="Notify when rooms are filling up before your events"
            checked={preferences.room_status_alerts ?? true}
            onCheckedChange={handleToggle("room_status_alerts")}
            disabled={saving}
          />

          <PreferenceToggle
            id="recording-available"
            label="Recording available"
            description="Notify when recordings are available for events you missed"
            checked={preferences.recording_available ?? true}
            onCheckedChange={handleToggle("recording_available")}
            disabled={saving}
          />

          <PreferenceToggle
            id="daily-summary"
            label="Daily summary"
            description="Receive morning and evening summaries during the conference"
            checked={preferences.daily_summary ?? true}
            onCheckedChange={handleToggle("daily_summary")}
            disabled={saving}
          />
        </div>

        <div className="border-t pt-4">
          <PreferenceToggle
            id="low-priority"
            label="Include low-priority bookmarks"
            description="Also notify for events you marked as lower priority"
            checked={preferences.notify_low_priority ?? false}
            onCheckedChange={handleToggle("notify_low_priority")}
            disabled={saving}
          />
        </div>
      </div>
    </div>
  );
}

type PreferenceToggleProps = {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
};

function PreferenceToggle({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
}: PreferenceToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label htmlFor={id}>{label}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  );
}
