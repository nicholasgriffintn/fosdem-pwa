"use client";

import { Icons } from "~/components/shared/Icons";
import type { UserConferenceStats } from "~/server/db/schema";
import type { User } from "~/server/db/schema";

type YearInReviewProps = {
  stats: UserConferenceStats | null | undefined;
  user: User | null | undefined;
  year: number;
};

function formatWatchTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes} minutes`;
}

export function YearInReview({ stats, user, year }: YearInReviewProps) {
  if (!stats) {
    return (
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 border rounded-xl p-8 text-center">
        <Icons.calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Your FOSDEM {year} Year in Review
        </h3>
        <p className="text-muted-foreground">
          Start attending events to see your personalized stats!
        </p>
      </div>
    );
  }

  const completionRate =
    stats.events_bookmarked && stats.events_bookmarked > 0
      ? Math.round(
        ((stats.events_attended ?? 0) / stats.events_bookmarked) * 100,
      )
      : 0;

  const userName = user?.name || user?.github_username || "FOSDEM Attendee";

  return (
    <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-background border rounded-xl overflow-hidden">
      <div className="p-8 space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-4 py-1 rounded-full text-sm font-medium mb-4">
            <Icons.star className="h-4 w-4" />
            Year in Review
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-2">
            FOSDEM {year}
          </h2>
          <p className="text-lg text-muted-foreground">{userName}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ReviewStat
            value={stats.events_attended ?? 0}
            label="Events Attended"
            icon={Icons.check}
          />
          <ReviewStat
            value={stats.events_attended_in_person ?? 0}
            label="In Person"
            icon={Icons.user}
          />
          <ReviewStat
            value={stats.tracks_covered ?? 0}
            label="Tracks Explored"
            icon={Icons.folder}
          />
          <ReviewStat
            value={stats.notes_taken ?? 0}
            label="Notes Taken"
            icon={Icons.fileText}
          />
        </div>

        <div className="bg-background/50 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Schedule Completion</span>
            <span className="text-2xl font-bold text-foreground">
              {completionRate}%
            </span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            You attended {stats.events_attended ?? 0} of{" "}
            {stats.events_bookmarked ?? 0} bookmarked events
          </p>
        </div>

        {(stats.total_watch_time_seconds ?? 0) > 0 && (
          <div className="text-center">
            <p className="text-muted-foreground">Total Watch Time</p>
            <p className="text-2xl font-bold text-foreground">
              {formatWatchTime(stats.total_watch_time_seconds ?? 0)}
            </p>
          </div>
        )}

        <div className="text-center pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Thank you for being part of FOSDEM {year}! 🎉
          </p>
        </div>
      </div>
    </div>
  );
}

type ReviewStatProps = {
  value: number;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

function ReviewStat({ value, label, icon: Icon }: ReviewStatProps) {
  return (
    <div className="text-center">
      <Icon className="h-6 w-6 mx-auto mb-2 text-primary" />
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
