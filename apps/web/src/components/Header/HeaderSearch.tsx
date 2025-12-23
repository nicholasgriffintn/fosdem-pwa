import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

import { NavSearch } from "~/components/Header/NavSearch";
import { cn } from "~/lib/utils";
import { Icons } from "~/components/shared/Icons";

type HeaderSearchProps = {
  year: number;
};

export function HeaderSearch({ year }: HeaderSearchProps) {
  const searchCheckboxRef = useRef<HTMLInputElement>(null);
  const locationKey = useRouterState({
    select: (state) => state.location.href,
  });

  useEffect(() => {
    if (searchCheckboxRef.current?.checked) {
      searchCheckboxRef.current.checked = false;
    }
  }, [locationKey]);

  return (
    <div className="relative flex items-center justify-end">
      <input
        ref={searchCheckboxRef}
        type="checkbox"
        id="mobile-search-toggle"
        className="peer/search sr-only lg:hidden"
        aria-label="Toggle search"
      />
      <label
        htmlFor="mobile-search-toggle"
        className={cn(
          "lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border bg-background",
          "text-foreground/80 hover:bg-muted/60 hover:text-foreground",
          "cursor-pointer",
        )}
      >
        <Icons.search className="h-4 w-4 peer-checked/search:hidden" />
        <Icons.close className="hidden h-4 w-4 peer-checked/search:inline" />
        <span className="sr-only">Search</span>
      </label>

      <div
        className={cn(
          "absolute right-0 top-full mt-2 hidden w-[min(92vw,24rem)]",
          "peer-checked/search:block",
          "lg:static lg:mt-0 lg:block lg:w-64",
        )}
      >
        <NavSearch year={year} />
      </div>
    </div>
  );
}