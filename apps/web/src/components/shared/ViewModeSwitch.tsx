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
          "inline-flex h-10 items-center gap-1 rounded-md border px-3 text-sm font-medium transition-colors ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "no-underline",
          viewMode === 'list'
            ? "bg-primary text-primary-foreground border-primary shadow-sm"
            : "bg-background hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <Icons.list className="h-4 w-4" />
        List
      </Link>
      <Link
        to="."
        search={(prev) => ({ ...prev, view: 'calendar' })}
        className={cn(
          "inline-flex h-10 items-center gap-1 rounded-md border px-3 text-sm font-medium transition-colors ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "no-underline",
          viewMode === 'calendar'
            ? "bg-primary text-primary-foreground border-primary shadow-sm"
            : "bg-background hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <Icons.calendar className="h-4 w-4" />
        Calendar
      </Link>
      <Link
        to="."
        search={(prev) => ({ ...prev, view: 'schedule' })}
        className={cn(
          "inline-flex h-10 items-center gap-1 rounded-md border px-3 text-sm font-medium transition-colors ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "no-underline",
          viewMode === 'schedule'
            ? "bg-primary text-primary-foreground border-primary shadow-sm"
            : "bg-background hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <Icons.clock className="h-4 w-4" />
        Schedule
      </Link>
    </div>
  )
}