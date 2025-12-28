"use client";

import { Icons } from "~/components/shared/Icons";
import type { UserConferenceStats } from "~/server/db/schema";

type ConferenceStatsProps = {
  stats: UserConferenceStats | null | undefined;
  loading?: boolean;
};

function formatWatchTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function ConferenceStats({ stats, loading }: ConferenceStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="bg-muted animate-pulse rounded-lg h-24"
          />
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <p className="text-muted-foreground text-center py-8">
        No stats available yet. Start bookmarking and attending events!
      </p>
    );
  }

  const statItems = [
    {
      label: "Events Bookmarked",
      value: stats.events_bookmarked ?? 0,
      icon: Icons.bookmark,
      color: "text-blue-500",
    },
    {
      label: "Events Attended",
      value: stats.events_attended ?? 0,
      icon: Icons.check,
      color: "text-green-500",
    },
    {
      label: "Attended In Person",
      value: stats.events_attended_in_person ?? 0,
      icon: Icons.user,
      color: "text-purple-500",
    },
    {
      label: "Recordings Watched",
      value: stats.events_watched ?? 0,
      icon: Icons.play,
      color: "text-orange-500",
    },
    {
      label: "Tracks Covered",
      value: stats.tracks_covered ?? 0,
      icon: Icons.folder,
      color: "text-cyan-500",
    },
    {
      label: "Notes Taken",
      value: stats.notes_taken ?? 0,
      icon: Icons.fileText,
      color: "text-yellow-500",
    },
    {
      label: "Watch Time",
      value: formatWatchTime(stats.total_watch_time_seconds ?? 0),
      icon: Icons.clock,
      color: "text-pink-500",
    },
    {
      label: "Completion Rate",
      value:
        stats.events_bookmarked && stats.events_bookmarked > 0
          ? `${Math.round(((stats.events_attended ?? 0) / stats.events_bookmarked) * 100)}%`
          : "0%",
      icon: Icons.target,
      color: "text-emerald-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statItems.map((item) => (
        <StatCard key={item.label} {...item} />
      ))}
    </div>
  );
}

type StatCardProps = {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
};

function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
  return (
    <div className="bg-card border rounded-lg p-4 flex flex-col items-center justify-center text-center">
      <Icon className={`h-6 w-6 mb-2 ${color}`} />
      <span className="text-2xl font-bold text-foreground">{value}</span>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}
