import { useEffect, useRef, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";

import { cn } from "~/lib/utils";
import { Icons } from "~/components/shared/Icons";
import { MobileNav } from "~/components/Header/MobileNav";
import { constants } from "~/constants";
import { isNumber } from "~/lib/type-guards";

type MainNavProps = {
  title: string;
  items?: {
    title: string;
    href: string;
    icon?: React.ReactNode;
		disabled?: boolean;
		mobileOnly?: boolean;
  }[];
};

export function MainNav({ title, items }: MainNavProps) {
  const menuCheckboxRef = useRef<HTMLInputElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const locationKey = useRouterState({
    select: (state) => state.location.href,
  });

  useEffect(() => {
    if (menuCheckboxRef.current?.checked) {
      menuCheckboxRef.current.checked = false;
      setIsMenuOpen(false);
    }
  }, [locationKey]);

  return (
    <div className="flex items-center gap-4 md:gap-6 lg:gap-10 shrink-0">
      <input
        type="checkbox"
        id="mobile-menu-toggle"
        ref={menuCheckboxRef}
        className="peer/menu sr-only"
        aria-label="Toggle mobile menu"
        onChange={(event) => setIsMenuOpen(event.currentTarget.checked)}
      />
      <label
        htmlFor="mobile-menu-toggle"
        className={cn(
          "lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-md border bg-background",
          "text-foreground/80 hover:bg-muted/60 hover:text-foreground",
          "shrink-0 cursor-pointer",
        )}
      >
        <Icons.list className="h-4 w-4 peer-checked/menu:hidden" />
        <Icons.close className="hidden h-4 w-4 peer-checked/menu:inline" />
        <span className="sr-only">Menu</span>
      </label>
      <Link
        to="/"
        search={(prev: Record<string, unknown>) => ({
          year: isNumber(prev.year) ? prev.year : constants.DEFAULT_YEAR,
        })}
        className="items-center space-x-2 flex logo-link shrink-0"
      >
        <Icons.logo className="h-7 w-7" width="28" height="28" />
        <span className="font-bold">{title}</span>
      </Link>
      {items?.length ? (
        <nav className="hidden gap-2 lg:flex shrink-0" aria-label="Primary">
					{items.filter((item) => !item.mobileOnly).map((item) => (
            <Link
              key={item.href}
              to={item.disabled ? "#" : item.href}
              className={cn(
                "nav-link flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors text-foreground/70 hover:text-foreground hover:bg-muted/60 whitespace-nowrap",
                item.disabled && "cursor-not-allowed opacity-80"
              )}
              activeProps={{
                className: cn(
                  "nav-link flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap",
                  "bg-muted text-foreground",
                  item.disabled && "cursor-not-allowed opacity-80"
                ),
              }}
              search={(prev: Record<string, unknown>) => ({
                year: isNumber(prev.year) ? prev.year : constants.DEFAULT_YEAR,
              })}
              activeOptions={{ exact: item.href === "/" }}
            >
              {item.icon}
              <span>{item.title}</span>
            </Link>
          ))}
        </nav>
      ) : null}
			{items && (
				<MobileNav
          title={title}
					items={items}
					menuCheckboxRef={menuCheckboxRef}
					isOpen={isMenuOpen}
					onClose={() => setIsMenuOpen(false)}
				/>
      )}
    </div>
  );
}
