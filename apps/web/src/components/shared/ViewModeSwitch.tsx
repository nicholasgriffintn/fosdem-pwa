import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router"

import { Icons } from "~/components/shared/Icons";
import { cn } from "~/lib/utils";

type ViewMode = "list" | "calendar" | "schedule";

type ViewModeOption = {
  value: ViewMode;
  label: string;
  icon: ReactNode;
};

const VIEW_MODE_OPTIONS: ViewModeOption[] = [
  { value: "list", label: "List", icon: <Icons.list className="h-4 w-4" /> },
  { value: "calendar", label: "Calendar", icon: <Icons.calendar className="h-4 w-4" /> },
  { value: "schedule", label: "Schedule", icon: <Icons.clock className="h-4 w-4" /> },
];

const baseButtonClass = "inline-flex h-10 items-center gap-1 rounded-md border px-3 text-sm font-medium transition-colors ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 no-underline";
const activeClass = "bg-primary text-primary-foreground border-primary shadow-sm";
const inactiveClass = "bg-background hover:bg-accent hover:text-accent-foreground";

type ViewModeSwitchProps = {
  viewMode: string;
};

export function ViewModeSwitch({ viewMode }: ViewModeSwitchProps) {
  return (
    <div className="flex gap-2">
      {VIEW_MODE_OPTIONS.map((option) => (
        <Link
          key={option.value}
          to="."
          search={(prev) => ({ ...prev, view: option.value })}
          className={cn(
            baseButtonClass,
            viewMode === option.value ? activeClass : inactiveClass
          )}
        >
          {option.icon}
          {option.label}
        </Link>
      ))}
    </div>
  );
}