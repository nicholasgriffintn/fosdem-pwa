"use client";

import { Icons } from "~/components/shared/Icons";
import { MastodonSignIn } from "~/components/Profile/MastodonSignIn";

interface UpgradeNoticeProps {
  user: {
    is_guest: boolean;
  };
}

export function UpgradeNotice({ user }: UpgradeNoticeProps) {
  if (!user.is_guest) {
    return null;
  }

  return (
    <div className="bg-muted/50 p-4 rounded-lg">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">
            You're using a guest account. Upgrade to save your data across devices.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <a
            href="/api/auth/upgrade-github"
            className="inline-flex items-center gap-2 rounded-md border border-gray-700 bg-gray-900 text-white px-3 py-1.5 text-sm font-medium transition-colors hover:bg-gray-800 no-underline"
          >
            <Icons.gitHub className="h-4 w-4" />
            GitHub
          </a>

          <a
            href="/api/auth/upgrade-discord"
            className="inline-flex items-center gap-2 rounded-md border border-[#4752C4] bg-[#5865F2] text-white px-3 py-1.5 text-sm font-medium transition-colors hover:bg-[#4752C4] no-underline"
          >
            <Icons.discord className="h-4 w-4" />
            Discord
          </a>

          <a
            href="/api/auth/upgrade-gitlab"
            className="inline-flex items-center gap-2 rounded-md border border-[#E24329] bg-[#FC6D26] text-white px-3 py-1.5 text-sm font-medium transition-colors hover:bg-[#E24329] no-underline"
          >
            <Icons.gitlab className="h-4 w-4" />
            GitLab
          </a>

          <MastodonSignIn disabled={false} isUpgrade={true} />
        </div>
      </div>
    </div>
  );
}
