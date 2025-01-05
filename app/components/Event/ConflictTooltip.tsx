import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { Icons } from "~/components/Icons";
import type { EventConflict } from "~/lib/fosdem";
import type { Event } from "~/types/fosdem";

type ConflictTooltipProps = {
  event: Event;
  conflicts?: EventConflict[];
  className?: string;
}

export function ConflictTooltip({ event, conflicts, className }: ConflictTooltipProps) {
  const eventConflicts = conflicts?.filter(
    conflict => conflict.event1.id === event.id || conflict.event2.id === event.id
  );

  if (!eventConflicts?.length) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={className}>
            <div className="bg-destructive text-destructive-foreground rounded-full p-1">
              <Icons.alertTriangle className="h-4 w-4" />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-semibold">Schedule Conflicts:</p>
            <ul className="text-sm list-disc list-inside">
              {eventConflicts.map(conflict => {
                const otherEvent = conflict.event1.id === event.id ? conflict.event2 : conflict.event1;
                return (
                  <li key={otherEvent.id}>
                    Overlaps with "{otherEvent.title}" by {conflict.overlapDuration} minutes
                  </li>
                );
              })}
            </ul>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 