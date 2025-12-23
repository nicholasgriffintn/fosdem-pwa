import { Link, useRouterState } from "@tanstack/react-router";

import { cn } from "~/lib/utils";
import { constants } from "~/constants";
import { isNumber } from "~/lib/type-guards";

type BottomTabNavProps = {
  items: {
    title: string;
    href: string;
    icon: React.ReactNode;
    disabled?: boolean;
    mobile?: boolean;
  }[];
};

export function BottomTabNav({ items }: BottomTabNavProps) {
  const locationKey = useRouterState({
    select: (state) => state.location.pathname,
  });

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 border-t lg:hidden transition-all duration-300 ease-in-out"
      aria-label="Mobile navigation"
    >
      <div className="grid grid-cols-4 h-16 max-w-md mx-auto">
        {items.filter((item) => item.mobile).map((item) => {
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
              search={(prev: Record<string, unknown>) => ({
                year: isNumber(prev.year) ? prev.year : constants.DEFAULT_YEAR,
              })}
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
