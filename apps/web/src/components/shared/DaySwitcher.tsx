import { Link } from "@tanstack/react-router";

import { cn } from "~/lib/utils";

type DaySwitcherProps = {
  days: { id: string; name: string }[];
  dayId?: string | number | string[] | number[];
  dataSplitByDay: Record<string, unknown[]>;
};

const baseClass = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-9 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground no-underline hover:underline";
const activeClass = "bg-primary text-primary-foreground border-primary";
const disabledClass = "pointer-events-none opacity-50";

export function DaySwitcher({
  days,
  dayId,
  dataSplitByDay,
}: DaySwitcherProps) {
  return (
    <>
      {days.map((dayItem) => {
        const hasEvents = (dataSplitByDay[dayItem.id]?.length ?? 0) > 0;
        const isActive = dayId === dayItem.id;

        return (
          <Link
            key={dayItem.id}
            to="."
            search={(prev) => ({ ...prev, day: dayItem.id })}
            disabled={!hasEvents}
            className={cn(
              baseClass,
              isActive && activeClass,
              !hasEvents && disabledClass
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {dayItem.name}
          </Link>
        );
      })}
    </>
  );
}