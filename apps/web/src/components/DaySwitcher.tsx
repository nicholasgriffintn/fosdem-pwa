import { Link } from "@tanstack/react-router";

import { cn } from "~/lib/utils";

export function DaySwitcher({
  days,
  dayId,
  datSplitByDay,
}: {
  days: { id: string; name: string }[];
  dayId?: string | number | string[] | number[];
    datSplitByDay: Record<string, any[]>;
}) {
  return (
    <>
      {days.map((dayItem) => {
        const hasEvents = Boolean(datSplitByDay[dayItem.id]);
        const isActive = dayId === dayItem.id;

        return (
          <Link
            key={dayItem.id}
            to="."
            search={(prev) => ({ ...prev, day: dayItem.id })}
            disabled={!hasEvents}
            className={cn(
              "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-9 px-4 py-2",
              "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
              isActive && "bg-primary text-primary-foreground border-primary",
              !hasEvents && "pointer-events-none opacity-50",
              "no-underline hover:underline"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {dayItem.name}
          </Link>
        );
      })}
    </>
  )
}