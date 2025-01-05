"use client";

import { useState } from "react";

import { Alert, AlertTitle, AlertDescription } from "~/components/ui/alert";
import { Icons } from "~/components/Icons";
import { groupConflicts, formatGroupedConflictMessage, type EventConflict } from "~/lib/fosdem";

export function Conflicts({
  conflicts,
}: {
  conflicts: EventConflict[];
}) {
  const [expandedConflicts, setExpandedConflicts] = useState<string[]>([]);

  const toggleConflict = (eventId: string) => {
    setExpandedConflicts(prev =>
      prev.includes(eventId)
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };

  return (
    <section>
      <Alert
        variant="destructive"
        className="bg-destructive/5 border-destructive/20"
      >
        <Icons.alertTriangle className="h-4 w-4 text-destructive/80" />
        <AlertTitle className="text-destructive/80">
          {conflicts.length} Schedule{" "}
          {conflicts.length === 1 ? "Conflict" : "Conflicts"} Detected
        </AlertTitle>
        <AlertDescription>
          <div className="max-h-[200px] overflow-y-auto mt-2 pr-2">
            {groupConflicts(conflicts).map((group) => (
              <div key={group.mainEvent.id} className="mb-4">
                <button
                  type="button"
                  onClick={() => toggleConflict(group.mainEvent.id)}
                  className="flex items-center justify-between w-full text-left text-sm text-muted-foreground hover:text-foreground"
                >
                  <span>{formatGroupedConflictMessage(group)}</span>
                  {expandedConflicts.includes(group.mainEvent.id) ? (
                    <Icons.chevronUp className="h-4 w-4" />
                  ) : (
                    <Icons.chevronDown className="h-4 w-4" />
                  )}
                </button>

                {expandedConflicts.includes(group.mainEvent.id) && (
                  <ul className="mt-2 pl-4 space-y-1">
                    {group.conflicts.map((conflict) => (
                      <li
                        key={conflict.event.id}
                        className="text-sm text-muted-foreground"
                      >
                        Overlaps with "{conflict.event.title}" by{" "}
                        {conflict.duration} minutes
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </AlertDescription>
      </Alert>
    </section>
  );
}