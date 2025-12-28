import type { UserConferenceStats } from "~/server/db/schema";
import type { Icons } from "~/components/shared/Icons";

export type Achievement = {
  id: string;
  label: string;
  icon: keyof typeof Icons;
  earned: boolean;
  description: string;
};

export function getAchievements(stats: UserConferenceStats | null | undefined): Achievement[] {
  if (!stats) {
    return [];
  }

  return [
    {
      id: "dedicated",
      label: "Dedicated Attendee",
      icon: "star" as const,
      description: "Attended 10+ events",
      earned: (stats.events_attended ?? 0) >= 10,
    },
    {
      id: "explorer",
      label: "Track Explorer",
      icon: "folder" as const,
      description: "Explored 5+ different tracks",
      earned: (stats.tracks_covered ?? 0) >= 5,
    },
    {
      id: "note_taker",
      label: "Diligent Note Taker",
      icon: "fileText" as const,
      description: "Took notes on 50%+ of events",
      earned:
        (stats.notes_taken ?? 0) > 0 &&
        (stats.events_attended ?? 0) > 0 &&
        (stats.notes_taken ?? 0) / (stats.events_attended ?? 1) >= 0.5,
    },
    {
      id: "completionist",
      label: "Schedule Master",
      icon: "target" as const,
      description: "Completed 80%+ of planned schedule",
      earned:
        (stats.events_bookmarked ?? 0) > 0 &&
        ((stats.events_attended ?? 0) / (stats.events_bookmarked ?? 1)) >= 0.8,
    },
    {
      id: "in_person",
      label: "In-Person Enthusiast",
      icon: "user" as const,
      description: "Attended 5+ events in person",
      earned: (stats.events_attended_in_person ?? 0) >= 5,
    },
    {
      id: "binge_watcher",
      label: "Recording Enthusiast",
      icon: "play" as const,
      description: "Watched 10+ recordings",
      earned: (stats.events_watched ?? 0) >= 10,
    },
  ];
}
