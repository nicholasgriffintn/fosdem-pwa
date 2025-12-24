import { Link, useRouterState } from "@tanstack/react-router";

import { cn } from "~/lib/utils";
import type { NavItem } from "~/components/shared/types";
import { preserveYearSearch } from "~/lib/search-params";

type BottomTabNavProps = {
  items: NavItem[];
};

export function BottomTabNav({ items }: BottomTabNavProps) {
  const locationKey = useRouterState({
    select: (state) => state.location.pathname,
  });

  const mobileItems = items.filter((item) => item.mobile);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 border-t lg:hidden transition-all duration-300 ease-in-out [padding-bottom:constant(safe-area-inset-bottom)] [padding-bottom:env(safe-area-inset-bottom)]"
      aria-label="Mobile navigation"
    >
      <div
        className="grid h-16 max-w-md mx-auto"
        style={{
          gridTemplateColumns: `repeat(${Math.max(mobileItems.length, 1)}, minmax(0, 1fr))`,
        }}
      >
        {mobileItems.map((item) => {
          const isActive = locationKey === item.href ||
            (item.href === "/" && locationKey === "/");

          return (
            <Link
              key={item.href}
              to={item.disabled ? "#" : item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-xs font-medium transition-all duration-200 ease-in-out no-underline",
                "text-muted-foreground hover:text-foreground hover:scale-105",
                isActive && "text-foreground scale-105",
                item.disabled && "cursor-not-allowed opacity-60 hover:scale-100",
              )}
              activeProps={{
                className: cn(
                  "flex flex-col items-center justify-center gap-1 text-xs font-medium transition-all duration-200 ease-in-out no-underline text-foreground scale-105",
                  item.disabled && "cursor-not-allowed opacity-60 hover:scale-100",
                ),
              }}
              search={preserveYearSearch}
              activeOptions={{ exact: item.href === "/" }}
            >
              <div className={cn(
                "h-5 w-5 transition-all duration-200 ease-in-out",
                isActive && "scale-110 drop-shadow-sm"
              )}>
                {item.icon}
              </div>
              <span className="transition-all duration-200">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
