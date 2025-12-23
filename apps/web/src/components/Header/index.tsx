import { Link, useSearch } from "@tanstack/react-router";
import { useIsClient } from "~/hooks/use-is-client";

import { Icons } from "~/components/shared/Icons";
import { MainNav } from "~/components/Header/MainNav";
import { Button } from "~/components/ui/button";
import { AvatarMenu } from "~/components/Header/UserMenu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { useAuth } from "~/hooks/use-auth";
import { Spinner } from "~/components/shared/Spinner";
import { constants } from "~/constants";
import { cn } from "~/lib/utils";
import { useAuthSnapshot } from "~/contexts/AuthSnapshotContext";
import { LoadingState } from "~/components/shared/LoadingState";
import { navItems } from "~/components/shared/NavItems";
import { HeaderSearch } from "~/components/Header/HeaderSearch";

export function Header() {
  const { year } = useSearch({ strict: false });
  const selectedYear = Number(year) || constants.DEFAULT_YEAR;

  const { user, loading } = useAuth();
  const { user: serverUser } = useAuthSnapshot();

  const isClient = useIsClient();
  const resolvedUser = isClient ? user : serverUser;
  const resolvedLoading = isClient ? loading : false;

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="container flex h-16 items-center justify-between gap-4">
        <MainNav title="FOSDEM PWA" items={navItems} />
        <div className="flex items-center justify-end gap-3">
          <nav className="hidden lg:flex items-center gap-2 shrink-0">
            {resolvedUser?.id ? (
              <AvatarMenu user={resolvedUser} />
            ) : resolvedLoading ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="h-7 w-7 flex items-center justify-center">
                      <Spinner />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <LoadingState type="spinner" size="sm" variant="inline" />
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="link"
                      size="sm"
                      className={cn(
                        "h-8 gap-2 px-3 text-muted-foreground no-underline whitespace-nowrap"
                      )}
                      asChild
                    >
                      <Link
                        to="/signin"
                        search={(prev: Record<string, unknown>) => ({
                          year: (prev.year as number) || constants.DEFAULT_YEAR,
                        })}
                      >
                        <Icons.login className="h-4 w-4" />
                        <span>Sign In</span>
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Sign in to save favourites</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </nav>
          <HeaderSearch year={selectedYear} />
        </div>
      </div>
    </header>
  );
}
