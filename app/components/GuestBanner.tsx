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
      <div className="container flex items-center space-x-4 sm:justify-between sm:space-x-0 gap-4 py-2 text-sm">
        <div className="flex items-center gap-2">
          <Icons.alertCircle className="h-4 w-4 text-muted-foreground" />
          <p>
            <span className="font-medium">Guest Mode:</span>{" "}
            <span className="text-muted-foreground">
              Your data will only be saved temporarily. Upgrade to a GitHub account to save your schedule permanently.
            </span>
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="gap-2 whitespace-nowrap"
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