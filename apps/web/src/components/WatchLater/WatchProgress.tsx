"use client";

import { cn } from "~/lib/utils";

type WatchProgressProps = {
  progressSeconds: number;
  durationSeconds?: number;
  watchStatus: "unwatched" | "watching" | "watched" | string;
  className?: string;
  showLabel?: boolean;
};

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

export function WatchProgress({
  progressSeconds,
  durationSeconds,
  watchStatus,
  className,
  showLabel = true,
}: WatchProgressProps) {
  if (watchStatus === "unwatched" && progressSeconds === 0) {
    return null;
  }

  const progressPercent = durationSeconds
    ? Math.min(100, (progressSeconds / durationSeconds) * 100)
    : undefined;

  return (
    <div className={cn("space-y-1", className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {watchStatus === "watched"
              ? "Watched"
              : watchStatus === "watching"
                ? "In progress"
                : ""}
          </span>
          <span>
            {formatTime(progressSeconds)}
            {durationSeconds && ` / ${formatTime(durationSeconds)}`}
          </span>
        </div>
      )}
      {progressPercent !== undefined && (
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              watchStatus === "watched" ? "bg-green-500" : "bg-primary",
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
    </div>
  );
}
