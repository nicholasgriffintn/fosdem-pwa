import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { NavSearch } from "~/components/Header/NavSearch";
import { cn } from "~/lib/utils";
import { Icons } from "~/components/shared/Icons";

type HeaderSearchProps = {
  year: number;
};

export function HeaderSearch({ year }: HeaderSearchProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const locationKey = useRouterState({
    select: (state) => state.location.href,
  });

  useEffect(() => {
    setIsMobileOpen(false);
    setResetKey((k) => k + 1);
    searchInputRef.current?.blur();
  }, [locationKey]);

  useEffect(() => {
    if (!isMobileOpen) return;
    const id = window.setTimeout(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    }, 0);
    return () => window.clearTimeout(id);
  }, [isMobileOpen]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!isMobileOpen) return;
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsMobileOpen(false);
        setResetKey((k) => k + 1);
        searchInputRef.current?.blur();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isMobileOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isMobileOpen) return;
      if (event.key !== "Escape") return;
      event.preventDefault();
      setIsMobileOpen(false);
      setResetKey((k) => k + 1);
      searchInputRef.current?.blur();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileOpen]);

  return (
    <div
      ref={containerRef}
      className="flex flex-1 min-w-0 items-center justify-end gap-2 lg:flex-none"
    >
      <div
        className={cn(
          "hidden lg:block lg:w-64",
          isMobileOpen ? "block flex-1 min-w-0" : "hidden",
          "lg:block",
        )}
      >
        <NavSearch
          year={year}
          inputRef={searchInputRef}
          resetKey={resetKey}
          fullWidth={isMobileOpen}
          className={cn(isMobileOpen ? "w-full" : undefined)}
        />
      </div>

      <button
        type="button"
        aria-label={isMobileOpen ? "Close search" : "Open search"}
        className={cn(
          "lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-md border bg-background",
          "text-foreground/80 hover:bg-muted/60 hover:text-foreground",
        )}
        onClick={() => {
          if (isMobileOpen) {
            setIsMobileOpen(false);
            setResetKey((k) => k + 1);
            searchInputRef.current?.blur();
            return;
          }
          setIsMobileOpen(true);
        }}
      >
        <Icons.search className={cn("h-4 w-4", isMobileOpen && "hidden")} />
        <Icons.close className={cn("h-4 w-4", !isMobileOpen && "hidden")} />
        <span className="sr-only">Search</span>
      </button>
    </div>
  );
}