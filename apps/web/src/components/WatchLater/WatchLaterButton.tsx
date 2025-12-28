"use client";

import { useCallback } from "react";

import { Button } from "~/components/ui/button";
import { Icons } from "~/components/shared/Icons";
import { toast } from "~/hooks/use-toast";
import { cn } from "~/lib/utils";

type WatchLaterButtonProps = {
  bookmarkId: string;
  isInWatchLater: boolean;
  onToggle: (bookmarkId: string) => Promise<unknown>;
  disabled?: boolean;
  variant?: "default" | "icon" | "compact";
  className?: string;
};

export function WatchLaterButton({
  bookmarkId,
  isInWatchLater,
  onToggle,
  disabled,
  variant = "default",
  className,
}: WatchLaterButtonProps) {
  const handleClick = useCallback(async () => {
    try {
      await onToggle(bookmarkId);
      toast({
        title: isInWatchLater ? "Removed from Watch Later" : "Added to Watch Later",
        description: isInWatchLater
          ? "Event removed from your watch later list"
          : "Event added to your watch later list",
      });
    } catch (error) {
      console.error("Failed to toggle watch later:", error);
      toast({
        title: "Failed to update",
        description: "Please try again",
        variant: "destructive",
      });
    }
  }, [bookmarkId, isInWatchLater, onToggle]);

  if (variant === "icon") {
    return (
      <Button
        variant={isInWatchLater ? "default" : "outline"}
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          isInWatchLater && "bg-primary text-primary-foreground",
          className,
        )}
        aria-label={isInWatchLater ? "Remove from Watch Later" : "Add to Watch Later"}
      >
        <Icons.clock className="h-4 w-4" />
      </Button>
    );
  }

  if (variant === "compact") {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          "gap-1",
          isInWatchLater && "text-primary",
          className,
        )}
      >
        <Icons.clock className="h-3 w-3" />
        {isInWatchLater ? "In Queue" : "Watch Later"}
      </Button>
    );
  }

  return (
    <Button
      variant={isInWatchLater ? "secondary" : "outline"}
      onClick={handleClick}
      disabled={disabled}
      className={cn("gap-2", className)}
    >
      <Icons.clock className="h-4 w-4" />
      {isInWatchLater ? "Remove from Watch Later" : "Add to Watch Later"}
    </Button>
  );
}
