"use client";

import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";

import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { Icons } from "~/components/shared/Icons";
import { Spinner } from "~/components/shared/Spinner";
import { toast } from "~/hooks/use-toast";
import { useIsClient } from "~/hooks/use-is-client";
import { toggleWatchLaterFromForm } from "~/server/functions/watch-later";
import { buildSearchParams } from "~/lib/url";

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
  const isClient = useIsClient();
  const returnTo = useRouterState({
    select: (state) => {
      const searchValue = state.location.search;
      if (searchValue) {
        return `${state.location.pathname}${buildSearchParams(searchValue)}`;
      }
      return state.location.pathname;
    },
  });
  const [currentStatus, setCurrentStatus] = useState(isInWatchLater);
  const [isProcessing, setIsProcessing] = useState(false);
  const lastSyncedStatusRef = useRef(isInWatchLater);

  useEffect(() => {
    if (isProcessing) {
      return;
    }

    if (lastSyncedStatusRef.current !== isInWatchLater) {
      lastSyncedStatusRef.current = isInWatchLater;
      setCurrentStatus(isInWatchLater);
    }
  }, [isInWatchLater, isProcessing]);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isProcessing) {
      return;
    }

    const newStatus = !currentStatus;
    const previousStatus = currentStatus;

    setIsProcessing(true);
    setCurrentStatus(newStatus);

    toast({
      title: newStatus ? "Added to Watch Later" : "Removed from Watch Later",
      description: "You can undo this action by clicking the button again",
    });

    try {
      await onToggle(bookmarkId);
    } catch (error) {
      console.error("Failed to toggle watch later:", error);
      setCurrentStatus(previousStatus);
      toast({
        title: "Failed to update",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isClient) {
    const iconElement = <Icons.clock className={variant === "compact" ? "h-3 w-3" : "h-4 w-4"} />;

    if (variant === "icon") {
      return (
        <div className={className}>
          <form method="post" action={toggleWatchLaterFromForm.url}>
            <input type="hidden" name="bookmarkId" value={bookmarkId} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <Button
              variant="outline"
              disabled={disabled}
              className="w-full"
              aria-label={isInWatchLater ? "Remove from Watch Later" : "Add to Watch Later"}
              type="submit"
            >
              <Icons.clock className={cn("h-4 w-4", isInWatchLater && "icon--filled")} />
            </Button>
          </form>
        </div>
      );
    }

    if (variant === "compact") {
      return (
        <form method="post" action={toggleWatchLaterFromForm.url}>
          <input type="hidden" name="bookmarkId" value={bookmarkId} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            className={cn(
              "gap-1",
              isInWatchLater && "text-primary",
              className,
            )}
            type="submit"
          >
            {iconElement}
            {isInWatchLater ? "In Queue" : "Watch Later"}
          </Button>
        </form>
      );
    }

    return (
      <form method="post" action={toggleWatchLaterFromForm.url}>
        <input type="hidden" name="bookmarkId" value={bookmarkId} />
        <input type="hidden" name="returnTo" value={returnTo} />
        <Button
          variant={isInWatchLater ? "secondary" : "outline"}
          disabled={disabled}
          className={cn("gap-2", className)}
          type="submit"
        >
          {iconElement}
          {isInWatchLater ? "Remove from Watch Later" : "Add to Watch Later"}
        </Button>
      </form>
    );
  }

  if (variant === "icon") {
    const tooltipLabel = currentStatus ? "Remove from Watch Later" : "Add to Watch Later";
    return (
      <div className={className}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              onClick={handleClick}
              disabled={disabled || isProcessing}
              className="w-full"
              aria-label={tooltipLabel}
            >
              {isProcessing ? (
                <Spinner className="h-4 w-4" />
              ) : (
                <Icons.clock className={cn("h-4 w-4", currentStatus && "icon--filled")} />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipLabel}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
        disabled={disabled || isProcessing}
        className={cn(
          "gap-1",
          currentStatus && "text-primary",
          className,
        )}
      >
        {isProcessing ? (
          <Spinner className="h-3 w-3" />
        ) : (
            <Icons.clock className="h-3 w-3" />
        )}
        {currentStatus ? "In Queue" : "Watch Later"}
      </Button>
    );
  }

  return (
    <Button
      variant={currentStatus ? "secondary" : "outline"}
      onClick={handleClick}
      disabled={disabled || isProcessing}
      className={cn("gap-2", className)}
    >
      {isProcessing ? (
        <Spinner className="h-4 w-4" />
      ) : (
          <Icons.clock className="h-4 w-4" />
      )}
      {currentStatus ? "Remove from Watch Later" : "Add to Watch Later"}
    </Button>
  );
}
