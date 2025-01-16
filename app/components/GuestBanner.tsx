"use client";

import { useAuth } from "~/hooks/use-auth";
import { Icons } from "~/components/Icons";
import { Button } from "~/components/ui/button";

export function GuestBanner() {
  const { user } = useAuth();

  if (!user?.is_guest) {
    return null;
  }

  return (
    <div className="bg-muted border-b">
      <div className="container flex flex-col sm:flex-row items-start sm:items-center space-x-4 sm:justify-between sm:space-x-0 py-3 text-sm">
        <div className="flex items-start sm:items-center gap-3">
          <Icons.alertCircle className="h-5 w-5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0 mt-0.5 sm:mt-0" />
          <p>
            <span className="font-medium">Guest Mode:</span>{" "}
            <span className="text-muted-foreground">
              Your data cannot be persisted across sessions. Upgrade to a GitHub account to save your schedule permanently.
            </span>
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="gap-2 whitespace-nowrap w-full sm:w-auto mt-2 sm:mt-0"
          asChild
        >
          <a href="/api/auth/upgrade-github" className="no-underline">
            <Icons.gitHub className="h-4 w-4" />
            Upgrade Now
          </a>
        </Button>
      </div>
    </div>
  );
} 