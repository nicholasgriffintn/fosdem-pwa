"use client";

import { Icons } from "~/components/shared/Icons";
import type { UserConferenceStats } from "~/server/db/schema";

type YearComparisonProps = {
  history: UserConferenceStats[];
  loading?: boolean;
};

function calculateGrowth(current: number, previous: number): { percentage: number; trend: 'up' | 'down' | 'neutral' } {
  if (previous === 0) {
    return { percentage: current > 0 ? 100 : 0, trend: current > 0 ? 'up' : 'neutral' };
  }
  const percentage = Math.round(((current - previous) / previous) * 100);
  return {
    percentage: Math.abs(percentage),
    trend: percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'neutral'
  };
}

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
        Year Over Year
      </h3>
      <div className="space-y-2">
        {sortedHistory.map((yearStats, index) => {
          const previousYear = sortedHistory[index + 1];
          const growth = previousYear
            ? calculateGrowth(yearStats.events_attended ?? 0, previousYear.events_attended ?? 0)
            : null;
          return (
            <YearRow key={yearStats.year} stats={yearStats} growth={growth} />
          );
        })}
      </div>
    </div>
  );
}

type YearRowProps = {
  stats: UserConferenceStats;
  growth: { percentage: number; trend: 'up' | 'down' | 'neutral' } | null;
};

function YearRow({ stats, growth }: YearRowProps) {
  const completionRate =
    stats.events_bookmarked && stats.events_bookmarked > 0
      ? Math.round(
        ((stats.events_attended ?? 0) / stats.events_bookmarked) * 100,
      )
      : 0;

  return (
    <div className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
      <div className="flex items-start md:items-center justify-between gap-4 flex-col md:flex-row">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xl md:text-2xl font-bold text-foreground">{stats.year}</span>
            {growth && growth.trend !== 'neutral' && (
              <div className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                growth.trend === 'up'
                  ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                  : 'bg-red-500/10 text-red-600 dark:text-red-400'
              }`}>
                {growth.trend === 'up' ? (
                  <Icons.trendingUp className="h-3 w-3" />
                ) : (
                  <Icons.trendingDown className="h-3 w-3" />
                )}
                <span>{growth.percentage}%</span>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-3 md:gap-4 text-xs md:text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Icons.bookmark className="h-3 w-3" />
              {stats.events_bookmarked ?? 0} bookmarked
            </span>
            <span className="flex items-center gap-1">
              <Icons.check className="h-3 w-3" />
              {stats.events_attended ?? 0} attended
            </span>
            <span className="flex items-center gap-1">
              <Icons.fileText className="h-3 w-3" />
              {stats.notes_taken ?? 0} notes
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex-1 md:w-32 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-foreground min-w-[3rem] text-right">
            {completionRate}%
          </span>
        </div>
      </div>
    </div>
  );
}
