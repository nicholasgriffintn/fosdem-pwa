import { Link } from "@tanstack/react-router"

import { Icons } from "~/components/shared/Icons";
import { cn } from "~/lib/utils";

export function ViewModeSwitch({
  viewMode,
}: {
  viewMode: string;
}) {
  return (
    <div className="flex gap-2">
      <Link
        to="."
        search={(prev) => ({ ...prev, view: 'list' })}
        className={cn(
          "inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
          "no-underline hover:underline",
          viewMode === 'list'
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-background hover:bg-accent"
        )}
      >
        <Icons.list className="h-4 w-4" />
        List
      </Link>
      <Link
        to="."
        search={(prev) => ({ ...prev, view: 'calendar' })}
        className={cn(
          "inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
          "no-underline hover:underline",
          viewMode === 'calendar'
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-background hover:bg-accent"
        )}
      >
        <Icons.calendar className="h-4 w-4" />
        Calendar
      </Link>
      <Link
        to="."
        search={(prev) => ({ ...prev, view: 'schedule' })}
        className={cn(
          "inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
          "no-underline hover:underline",
          viewMode === 'schedule'
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-background hover:bg-accent"
        )}
      >
        <Icons.clock className="h-4 w-4" />
        Schedule
      </Link>
    </div>
  )
}