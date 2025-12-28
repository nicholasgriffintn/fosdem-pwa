"use client";

import { Icons } from "~/components/shared/Icons";
import type { UserConferenceStats } from "~/server/db/schema";
import type { User } from "~/server/db/schema";

type YearInReviewProps = {
  stats: UserConferenceStats | null | undefined;
  user: User | null | undefined;
  year: number;
};

type ReviewTheme = {
  header: string;
  accent: string;
  pattern: string;
};

function formatWatchTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes} minutes`;
}

function hashStringToInt(input: string) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function getReviewTheme(seed: string) {
  const themes: ReviewTheme[] = [
    { header: "#9B3493", accent: "#9B3493", pattern: "rgba(255,255,255,0.12)" },
    { header: "#2563EB", accent: "#2563EB", pattern: "rgba(255,255,255,0.14)" },
    { header: "#16A34A", accent: "#16A34A", pattern: "rgba(255,255,255,0.12)" },
    { header: "#EA580C", accent: "#EA580C", pattern: "rgba(255,255,255,0.14)" },
    { header: "#0F766E", accent: "#0F766E", pattern: "rgba(255,255,255,0.12)" },
  ];
  const hash = hashStringToInt(seed);
  const theme = themes[hash % themes.length];
  const patternVariant = (hash >>> 3) % 3;
  return { theme, patternVariant };
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
  const seed = `${user?.id ?? user?.github_username ?? "guest"}_${year}`;
  const { theme, patternVariant } = getReviewTheme(seed);

  return (
    <div
      className="relative bg-background border rounded-xl overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(135deg, ${theme.header}22, transparent 65%), linear-gradient(180deg, ${theme.header}1a, transparent)`,
        ["--review-accent" as string]: theme.accent,
        ["--review-accent-soft" as string]: `${theme.accent}22`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            patternVariant === 0
              ? `repeating-linear-gradient(135deg, ${theme.pattern} 0 8px, transparent 8px 16px)`
              : patternVariant === 1
                ? `radial-gradient(circle at 20% 20%, ${theme.pattern} 0 2px, transparent 2px 14px), radial-gradient(circle at 80% 30%, ${theme.pattern} 0 2px, transparent 2px 16px), radial-gradient(circle at 40% 80%, ${theme.pattern} 0 2px, transparent 2px 18px)`
                : `linear-gradient(90deg, ${theme.pattern} 0 1px, transparent 1px 18px), linear-gradient(0deg, ${theme.pattern} 0 1px, transparent 1px 18px)`,
          opacity: 0.35,
        }}
      />
      <div className="relative p-8 space-y-6">
        <div className="text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-1 rounded-full text-sm font-medium mb-4"
            style={{ backgroundColor: theme.accent, color: "#fff" }}
          >
            <Icons.star className="h-4 w-4 text-white" />
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

        <div className="bg-background/60 rounded-lg p-6 space-y-4 border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Schedule Completion</span>
            <span className="text-2xl font-bold text-foreground">
              {completionRate}%
            </span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                backgroundImage: `linear-gradient(90deg, ${theme.accent}, ${theme.accent}aa)`,
                width: `${completionRate}%`,
              }}
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
      <div
        className="h-12 w-12 mx-auto mb-2 rounded-2xl flex items-center justify-center"
        style={{ backgroundColor: "var(--review-accent-soft)" }}
      >
        <Icon className="h-6 w-6" />
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
