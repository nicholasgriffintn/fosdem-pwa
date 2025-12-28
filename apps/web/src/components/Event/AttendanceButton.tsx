"use client";

import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";

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
import { toggleAttendanceFromForm } from "~/server/functions/user-stats";
import { buildSearchParams } from "~/lib/url";

type AttendanceButtonProps = {
  bookmarkId: string;
  isAttended: boolean;
  onMarkAttended: (params: { bookmarkId: string; inPerson?: boolean }) => Promise<unknown>;
  onUnmarkAttended: (bookmarkId: string) => Promise<unknown>;
  disabled?: boolean;
  className?: string;
};

export function AttendanceButton({
  bookmarkId,
  isAttended,
  onMarkAttended,
  onUnmarkAttended,
  disabled,
  className,
}: AttendanceButtonProps) {
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
  const [currentStatus, setCurrentStatus] = useState(isAttended);
  const [isProcessing, setIsProcessing] = useState(false);
  const lastSyncedStatusRef = useRef(isAttended);

  useEffect(() => {
    if (isProcessing) {
      return;
    }

    if (lastSyncedStatusRef.current !== isAttended) {
      lastSyncedStatusRef.current = isAttended;
      setCurrentStatus(isAttended);
    }
  }, [isAttended, isProcessing]);

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
      title: newStatus ? "Marked as attended" : "Attendance removed",
      description: "You can undo this action by clicking the button again",
    });

    try {
      if (newStatus) {
        await onMarkAttended({ bookmarkId, inPerson: false });
      } else {
        await onUnmarkAttended(bookmarkId);
      }
    } catch (error) {
      console.error("Failed to update attendance:", error);
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
    return (
      <div className={className}>
        <form method="post" action={toggleAttendanceFromForm.url}>
          <input type="hidden" name="bookmarkId" value={bookmarkId} />
          <input type="hidden" name="currentStatus" value={String(isAttended)} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <Button
            variant="outline"
            disabled={disabled}
            aria-label={isAttended ? "Remove attendance" : "Mark as attended"}
            type="submit"
            className="w-full"
          >
            <Icons.check className={isAttended ? "icon--filled" : ""} />
          </Button>
        </form>
      </div>
    );
  }

  const tooltipLabel = currentStatus ? "Remove attendance" : "Mark as attended";

  return (
    <div className={className}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            onClick={handleClick}
            disabled={disabled || isProcessing}
            aria-label={tooltipLabel}
            className="w-full"
          >
            {isProcessing ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <Icons.check className={currentStatus ? "icon--filled" : ""} />
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
