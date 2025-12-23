import type { ReactNode } from "react";

import { cn } from "~/lib/utils";

type PageShellProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  maxWidth?: "none" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl";
};

export function PageShell({
  children,
  className,
  contentClassName,
  maxWidth = "none",
}: PageShellProps) {
  const maxWidthClass =
    maxWidth === "none"
      ? ""
      : maxWidth === "2xl"
        ? "max-w-2xl"
        : maxWidth === "3xl"
          ? "max-w-3xl"
          : maxWidth === "4xl"
            ? "max-w-4xl"
            : maxWidth === "5xl"
              ? "max-w-5xl"
              : "max-w-6xl";

  return (
    <div className="min-h-screen">
      <div className={cn("relative py-4 lg:py-8", className)}>
        <div
          className={cn(
            "mx-auto",
            maxWidth !== "none" ? "w-full px-4 sm:px-6 lg:px-8" : "",
            maxWidthClass,
            contentClassName,
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
