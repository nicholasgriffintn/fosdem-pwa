"use client";

import { Icons } from "~/components/shared/Icons";
import type { UserConferenceStats } from "~/server/db/schema";
import type { User } from "~/server/db/schema";
import { getAchievements, type Achievement } from "~/lib/achievements";

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
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes} minutes`;
}

function getInsightMessage(stats: UserConferenceStats): string | null {
  const eventsAttended = stats.events_attended ?? 0;
  const eventsBookmarked = stats.events_bookmarked ?? 0;
  const notesTaken = stats.notes_taken ?? 0;
  const tracksCovered = stats.tracks_covered ?? 0;
  const watchTimeSeconds = stats.total_watch_time_seconds ?? 0;
  const eventsWatched = stats.events_watched ?? 0;

  if (tracksCovered > 0 && eventsAttended > 0) {
    const avgPerTrack = Math.round(eventsAttended / tracksCovered);
    if (avgPerTrack >= 3) {
      return `You averaged ${avgPerTrack} events per track you explored`;
    }
  }

  if (notesTaken > 0 && eventsAttended > 0) {
    const noteRate = (notesTaken / eventsAttended) * 100;
    if (noteRate >= 75) {
      return `You took notes on ${Math.round(noteRate)}% of attended events`;
    }
  }

  if (watchTimeSeconds > 3600) {
    const hours = Math.floor(watchTimeSeconds / 3600);
    if (hours >= 10) {
      return `You watched ${hours} hours of FOSDEM content`;
    }
  }

  if (eventsBookmarked > 0 && eventsAttended > 0) {
    const completionRate = (eventsAttended / eventsBookmarked) * 100;
    if (completionRate >= 90) {
      return `You attended ${Math.round(completionRate)}% of your planned events`;
    }
  }

  if (eventsWatched > 0 && eventsAttended > 0) {
    if (eventsWatched > eventsAttended) {
      return `You watched ${eventsWatched - eventsAttended} more recordings than live events`;
    }
  }

  return null;
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
        <p className="text-muted-foreground mb-4">
          Mark events as attended or watch recordings to build your year in review
        </p>
        <p className="text-sm text-muted-foreground">
          Your stats will appear here as you engage with FOSDEM content
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
  const achievements = getAchievements(stats);
  const earnedAchievements = achievements.filter((a) => a.earned);
  const insightMessage = getInsightMessage(stats);

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
      <div className="relative p-6 md:p-8 space-y-6">
        <div className="text-center space-y-3">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium"
            style={{ backgroundColor: theme.accent, color: "#fff" }}
          >
            <Icons.star className="h-4 w-4 text-white fill-white" />
            Year in Review
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            FOSDEM {year}
          </h2>
          <p className="text-lg text-muted-foreground">{userName}</p>
        </div>

        {insightMessage && (
          <div
            className="bg-background/80 backdrop-blur-sm border rounded-lg p-4 text-center"
            style={{ borderColor: `${theme.accent}33` }}
          >
            <p className="text-sm md:text-base font-medium" style={{ color: theme.accent }}>
              {insightMessage}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <ReviewStat
            value={stats.events_attended ?? 0}
            label="Events Attended"
            icon={Icons.check}
            theme={theme}
          />
          <ReviewStat
            value={stats.events_attended_in_person ?? 0}
            label="In Person"
            icon={Icons.user}
            theme={theme}
          />
          <ReviewStat
            value={stats.tracks_covered ?? 0}
            label="Tracks Explored"
            icon={Icons.folder}
            theme={theme}
          />
          <ReviewStat
            value={stats.notes_taken ?? 0}
            label="Notes Taken"
            icon={Icons.fileText}
            theme={theme}
          />
        </div>

        {earnedAchievements.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              Achievements
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {earnedAchievements.map((achievement) => (
                <AchievementBadge key={achievement.id} achievement={achievement} theme={theme} />
              ))}
            </div>
          </div>
        )}

        <div className="bg-background/60 backdrop-blur-sm rounded-lg p-4 md:p-6 space-y-4 border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-sm md:text-base text-muted-foreground">Schedule Completion</span>
            <span className="text-2xl md:text-3xl font-bold text-foreground">
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
          <p className="text-xs md:text-sm text-muted-foreground text-center">
            You attended {stats.events_attended ?? 0} of{" "}
            {stats.events_bookmarked ?? 0} bookmarked events
          </p>
        </div>

        {(stats.total_watch_time_seconds ?? 0) > 0 && (
          <div className="bg-background/60 backdrop-blur-sm rounded-lg p-4 md:p-6 border border-white/10 text-center">
            <p className="text-sm text-muted-foreground mb-2">Total Watch Time</p>
            <p className="text-3xl md:text-4xl font-bold text-foreground">
              {formatWatchTime(stats.total_watch_time_seconds ?? 0)}
            </p>
            {(stats.events_watched ?? 0) > 0 && (
              <p className="text-xs md:text-sm text-muted-foreground mt-2">
                Across {stats.events_watched} recording{stats.events_watched !== 1 ? 's' : ''}
              </p>
            )}
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
  theme: ReviewTheme;
};

function ReviewStat({ value, label, icon: Icon, theme }: ReviewStatProps) {
  return (
    <div className="text-center group">
      <div
        className="h-12 w-12 md:h-14 md:w-14 mx-auto mb-2 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 [&>svg]:text-[--icon-color]"
        style={{ backgroundColor: `${theme.accent}22`, ['--icon-color' as string]: theme.accent }}
      >
        <Icon className="h-5 w-5 md:h-6 md:w-6" />
      </div>
      <p className="text-2xl md:text-3xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

type AchievementBadgeProps = {
  achievement: Achievement;
  theme: ReviewTheme;
};

function AchievementBadge({ achievement, theme }: AchievementBadgeProps) {
  const Icon = Icons[achievement.icon];
  return (
    <div
      className="bg-background/60 backdrop-blur-sm border rounded-lg p-3 flex items-center gap-3 transition-all hover:scale-105"
      style={{ borderColor: `${theme.accent}33` }}
    >
      <div
        className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 [&>svg]:text-[--icon-color]"
        style={{ backgroundColor: `${theme.accent}22`, ['--icon-color' as string]: theme.accent }}
      >
        <Icon className="h-4 w-4" />
      </div>
      <span className="text-xs md:text-sm font-medium text-foreground leading-tight">
        {achievement.label}
      </span>
    </div>
  );
}
