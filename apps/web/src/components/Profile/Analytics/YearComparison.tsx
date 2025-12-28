"use client";

import type { UserConferenceStats } from "~/server/db/schema";

type YearComparisonProps = {
  history: UserConferenceStats[];
  loading?: boolean;
};

export function YearComparison({ history, loading }: YearComparisonProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-muted animate-pulse rounded-lg h-16"
          />
        ))}
      </div>
    );
  }

  if (!history.length) {
    return (
      <p className="text-muted-foreground text-center py-4">
        No historical data available yet.
      </p>
    );
  }

  const sortedHistory = [...history].sort((a, b) => b.year - a.year);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">
        History
      </h3>
      <div className="space-y-2">
        {sortedHistory.map((yearStats) => (
          <YearRow key={yearStats.year} stats={yearStats} />
        ))}
      </div>
    </div>
  );
}

type YearRowProps = {
  stats: UserConferenceStats;
};

function YearRow({ stats }: YearRowProps) {
  const completionRate =
    stats.events_bookmarked && stats.events_bookmarked > 0
      ? Math.round(
        ((stats.events_attended ?? 0) / stats.events_bookmarked) * 100,
      )
      : 0;

  return (
    <div className="border rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <span className="text-xl font-bold text-foreground">{stats.year}</span>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>{stats.events_bookmarked ?? 0} bookmarked</span>
          <span>{stats.events_attended ?? 0} attended</span>
          <span>{stats.notes_taken ?? 0} notes</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full"
            style={{ width: `${completionRate}%` }}
          />
        </div>
        <span className="text-sm font-medium text-foreground">
          {completionRate}%
        </span>
      </div>
    </div>
  );
}
