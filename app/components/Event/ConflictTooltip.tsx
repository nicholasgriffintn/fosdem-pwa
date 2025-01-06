"use client";

import { useState } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { Icons } from "~/components/Icons";
import type { EventConflict } from "~/lib/fosdem";
import type { Event } from "~/types/fosdem";
import { Button } from "~/components/ui/button";

type ConflictTooltipProps = {
  event: Event;
  conflicts?: EventConflict[];
  className?: string;
  onSetPriority?: (eventId: string, updates: { priority: number | null }) => void;
  priority?: number;
}

export function ConflictTooltip({ event, conflicts, className, onSetPriority, priority }: ConflictTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const eventConflicts = conflicts?.filter(
    conflict => conflict.event1.id === event.id || conflict.event2.id === event.id
  );

  if (!eventConflicts?.length) {
    return null;
  }

  const getPriorityColor = (p?: number) => {
    if (!p) return 'bg-destructive text-destructive-foreground';
    switch (p) {
      case 1: return 'bg-primary text-primary-foreground';
      case 2: return 'bg-orange-500 text-white dark:text-primary-foreground';
      default: return 'bg-destructive text-destructive-foreground';
    }
  };

  const handleSetPriority = (newPriority: number) => {
    if (newPriority === 0) {
      onSetPriority?.(event.id, { priority: null });
      setIsOpen(false);
      return;
    }

    onSetPriority?.(event.id, { priority: 1 });

    // biome-ignore lint/complexity/noForEach: <explanation>
    eventConflicts.forEach(conflict => {
      const otherEvent = conflict.event1.id === event.id ? conflict.event2 : conflict.event1;
      onSetPriority?.(otherEvent.id, { priority: 2 });
    });

    setIsOpen(false);
  };

  return (
    <TooltipProvider>
      <Tooltip open={isOpen} onOpenChange={setIsOpen}>
        <TooltipTrigger asChild>
          <div className={className}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${getPriorityColor(priority)}`}>
              {priority ? (
                <span className="font-semibold text-sm">{priority}</span>
              ) : (
                <Icons.alertTriangle className="h-4 w-4" />
              )}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent className="w-[300px]">
          <div className="space-y-3">
            <div>
              <p className="font-semibold">Schedule Conflicts:</p>
              <div className="max-h-[200px] overflow-y-auto">
                <ul className="text-sm list-disc list-inside">
                  {eventConflicts.map(conflict => {
                    const otherEvent = conflict.event1.id === event.id ? conflict.event2 : conflict.event1;
                    const otherEventPriority = otherEvent.priority;
                    return (
                      <li key={otherEvent.id} className="flex items-center gap-2">
                        <span className="truncate">
                          Overlaps with "{otherEvent.title}" by {conflict.overlapDuration} minutes
                          {otherEventPriority && ` (Priority: ${otherEventPriority})`}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
            {onSetPriority && (
              <div className="border-t pt-2">
                <p className="text-sm mb-2">Prioritize this event over its conflicts?</p>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant={priority === 1 ? "default" : "outline"}
                    onClick={() => handleSetPriority(1)}
                  >
                    Yes, attend this
                  </Button>
                  {priority && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleSetPriority(0)}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 