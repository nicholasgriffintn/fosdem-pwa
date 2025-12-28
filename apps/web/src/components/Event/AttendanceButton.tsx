"use client";

import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";

import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Icons } from "~/components/shared/Icons";
import { Spinner } from "~/components/shared/Spinner";
import { toast } from "~/hooks/use-toast";
import { useIsClient } from "~/hooks/use-is-client";
import { toggleAttendanceFromForm } from "~/server/functions/user-stats";
import { buildSearchParams } from "~/lib/url";

type AttendanceButtonProps = {
  bookmarkId: string;
  isAttended: boolean;
  isInPerson?: boolean;
  onMarkAttended: (params: { bookmarkId: string; inPerson?: boolean }) => Promise<unknown>;
  onUnmarkAttended: (bookmarkId: string) => Promise<unknown>;
  disabled?: boolean;
  className?: string;
};

export function AttendanceButton({
  bookmarkId,
  isAttended,
  isInPerson = false,
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
  const [currentInPerson, setCurrentInPerson] = useState(isInPerson);
  const [isProcessing, setIsProcessing] = useState(false);
  const lastSyncedStatusRef = useRef(isAttended);
  const lastSyncedInPersonRef = useRef(isInPerson);

  useEffect(() => {
    if (isProcessing) {
      return;
    }

    if (lastSyncedStatusRef.current !== isAttended) {
      lastSyncedStatusRef.current = isAttended;
      setCurrentStatus(isAttended);
    }
    if (lastSyncedInPersonRef.current !== isInPerson) {
      lastSyncedInPersonRef.current = isInPerson;
      setCurrentInPerson(isInPerson);
    }
  }, [isAttended, isInPerson, isProcessing]);

  const updateAttendance = async ({
    nextAttended,
    nextInPerson,
  }: {
    nextAttended: boolean;
    nextInPerson?: boolean;
  }) => {
    if (isProcessing) {
      return;
    }

    const resolvedInPerson = nextAttended ? nextInPerson === true : false;
    const previousStatus = currentStatus;
    const previousInPerson = currentInPerson;

    setIsProcessing(true);
    setCurrentStatus(nextAttended);
    setCurrentInPerson(resolvedInPerson);

    const wasAttended = currentStatus;
    const updatedMode =
      wasAttended && nextAttended && previousInPerson !== resolvedInPerson;
    const title = nextAttended
      ? updatedMode
        ? "Attendance updated"
        : resolvedInPerson
          ? "Marked as attended in person"
          : "Marked as attended online"
      : "Attendance removed";
    toast({
      title,
      description: "You can update this from the same menu",
    });

    try {
      if (nextAttended) {
        await onMarkAttended({ bookmarkId, inPerson: resolvedInPerson });
      } else {
        await onUnmarkAttended(bookmarkId);
      }
    } catch (error) {
      console.error("Failed to update attendance:", error);
      setCurrentStatus(previousStatus);
      setCurrentInPerson(previousInPerson);
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

  const tooltipLabel = currentStatus
    ? currentInPerson
      ? "Attended in person"
      : "Attended online"
    : "Mark as attended";
  const inPersonLabel = currentStatus ? "In person" : "Attend in person";
  const onlineLabel = currentStatus ? "Online" : "Attend online";

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled || isProcessing}
            aria-label={tooltipLabel}
            className="w-full"
          >
            {isProcessing ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <>
                <Icons.check className={currentStatus ? "icon--filled" : ""} />
                <Icons.chevronDown className="h-3 w-3 opacity-70" />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {currentStatus && (
            <DropdownMenuLabel>
              {currentInPerson ? "Currently: in person" : "Currently: online"}
            </DropdownMenuLabel>
          )}
          <DropdownMenuItem
            disabled={currentStatus && currentInPerson}
            onClick={() =>
              updateAttendance({ nextAttended: true, nextInPerson: true })
            }
          >
            {inPersonLabel}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={currentStatus && !currentInPerson}
            onClick={() =>
              updateAttendance({ nextAttended: true, nextInPerson: false })
            }
          >
            {onlineLabel}
          </DropdownMenuItem>
          {currentStatus && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => updateAttendance({ nextAttended: false })}>
                Remove attendance
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
