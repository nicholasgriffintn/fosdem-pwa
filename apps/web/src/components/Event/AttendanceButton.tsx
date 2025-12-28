"use client";

import { useCallback } from "react";

import { Button } from "~/components/ui/button";
import { Icons } from "~/components/shared/Icons";
import { toast } from "~/hooks/use-toast";

type AttendanceButtonProps = {
  bookmarkId: string;
  isAttended: boolean;
  onMarkAttended: (params: { bookmarkId: string; inPerson?: boolean }) => Promise<unknown>;
  onUnmarkAttended: (bookmarkId: string) => Promise<unknown>;
  disabled?: boolean;
};

export function AttendanceButton({
  bookmarkId,
  isAttended,
  onMarkAttended,
  onUnmarkAttended,
  disabled,
}: AttendanceButtonProps) {
  const handleClick = useCallback(async () => {
    try {
      if (isAttended) {
        await onUnmarkAttended(bookmarkId);
        toast({
          title: "Attendance removed",
          description: "Event is no longer marked as attended",
        });
      } else {
        await onMarkAttended({ bookmarkId, inPerson: false });
        toast({
          title: "Marked as attended",
          description: "Event marked as attended",
        });
      }
    } catch (error) {
      console.error("Failed to update attendance:", error);
      toast({
        title: "Failed to update",
        description: "Please try again",
        variant: "destructive",
      });
    }
  }, [bookmarkId, isAttended, onMarkAttended, onUnmarkAttended]);

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      disabled={disabled}
      aria-label={isAttended ? "Remove attendance" : "Mark as attended"}
    >
      <Icons.check className={isAttended ? "icon--filled" : ""} />
    </Button>
  );
}
