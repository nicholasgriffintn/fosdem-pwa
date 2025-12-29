import { createFileRoute, Navigate } from "@tanstack/react-router";

import { useProfile } from "~/hooks/use-user-me";
import { useBookmarks } from "~/hooks/use-bookmarks";
import { useMutateBookmark } from "~/hooks/use-mutate-bookmark";
import { PageHeader } from "~/components/shared/PageHeader";
import { ConferenceBadge } from "~/components/Profile/ConferenceBadge";
import { constants } from "~/constants";
import { useFosdemData } from "~/hooks/use-fosdem-data";
import { BookmarksList } from "~/components/Bookmarks/BookmarksList";
import { SetBookmarksVisability } from "~/components/Profile/SetBookmarksVisability";
import { PushNotifications } from "~/components/PushNotifications";
import { UpgradeNotice } from "~/components/shared/UpgradeNotice";
import { buildHomeLink } from "~/lib/link-builder";
import { generateCommonSEOTags } from "~/utils/seo-generator";
import { PageShell } from "~/components/shared/PageShell";
import { RouteLoadingState } from "~/components/shared/RouteLoadingState";
import { SectionStack } from "~/components/shared/SectionStack";
import { getAllData } from "~/server/functions/fosdem";
import { getBookmarks } from "~/server/functions/bookmarks";
import { getUserStats } from "~/server/functions/user-stats";
import { useAuthSnapshot } from "~/contexts/AuthSnapshotContext";
import { useIsClient } from "~/hooks/use-is-client";
import { useUserStats } from "~/hooks/use-user-stats";

export const Route = createFileRoute("/profile/")({
  component: ProfilePage,
  head: () => ({
    meta: [
      ...generateCommonSEOTags({
        title: "Profile | FOSDEM PWA",
        description: "Profile page",
      })
    ],
  }),
  validateSearch: ({
    year,
    day,
    view,
    tab,
  }: {
    year: number;
      day?: string;
      view?: string;
    tab?: "events" | "tracks" | "all";
  }) => {
    const normalizedYear =
      (constants.AVAILABLE_YEARS.includes(year) && year) || constants.DEFAULT_YEAR;
    const normalizedTab =
      tab && ["events", "tracks", "all"].includes(tab) ? tab : undefined;

    return {
      year: normalizedYear,
      day: day || undefined,
      view: view || undefined,
      ...(normalizedTab ? { tab: normalizedTab } : {}),
    };
  },
  loaderDeps: ({ search: { year, day, view, tab } }) => ({ year, day, view, tab }),
  loader: async ({ deps: { year } }) => {
    const [fosdemData, serverBookmarks, stats] = await Promise.all([
      getAllData({ data: { year } }),
      getBookmarks({ data: { year, status: "favourited" } }),
      getUserStats({ data: { year } }),
    ]);

    return {
      year,
      fosdemData,
      serverBookmarks,
      stats,
    };
  },
});

function ProfilePage() {
  const { year, fosdemData: serverFosdemData, serverBookmarks, stats: serverStats } =
    Route.useLoaderData();
  const { tab: tabRaw, day, view } = Route.useSearch();
  const tab = tabRaw ?? "events";
  const { user, loading } = useProfile();
  const { user: serverUserFromRoot } = useAuthSnapshot();
  const resolvedServerUser = serverUserFromRoot;
  const { bookmarks, loading: bookmarksLoading } = useBookmarks({
    year,
    initialServerBookmarks: serverBookmarks,
  });
  const { create: createBookmark } = useMutateBookmark({ year });
  const { fosdemData } = useFosdemData({ year, initialData: serverFosdemData });
  const { stats, loading: statsLoading } = useUserStats({ year });
  const isClient = useIsClient();
  const hasServerSnapshot = Boolean(serverFosdemData);
  const useServerSnapshot =
    !isClient || loading || bookmarksLoading || !fosdemData || !bookmarks;
  const resolvedUser = useServerSnapshot ? resolvedServerUser : user;
  const resolvedBookmarks = useServerSnapshot ? serverBookmarks : bookmarks;
  const resolvedBookmarksLoading = useServerSnapshot ? false : bookmarksLoading;
  const resolvedFosdemData = useServerSnapshot ? serverFosdemData : fosdemData;
  const resolvedStats = useServerSnapshot ? serverStats : stats;

  const profileIdentifier = resolvedUser
    ? resolvedUser.github_username ||
    resolvedUser.gitlab_username ||
    resolvedUser.discord_username ||
    resolvedUser.mastodon_acct ||
    resolvedUser.mastodon_username ||
    "me"
    : "me";

  const onCreateBookmark = async (bookmark: any) => {
    await createBookmark(bookmark);
  };

  if (isClient && loading && !hasServerSnapshot) {
    return (
      <RouteLoadingState message="Loading profile..." />
    );
  }

  if (!resolvedUser) {
    return <Navigate {...buildHomeLink()} />;
  }

  return (
    <PageShell>
      <PageHeader heading="Profile" year={year} displayHeading={false} />
      <SectionStack>
        {resolvedUser.is_guest && (
          <UpgradeNotice user={resolvedUser} />
        )}

        <div className="flex flex-col lg:flex-row items-start gap-8">
          <div className="w-full lg:w-auto lg:max-w-md">
            <ConferenceBadge user={resolvedUser} conferenceYear={year} stats={resolvedStats} />
          </div>

          <div className="w-full lg:flex-1 space-y-8">
            {!resolvedUser.is_guest && <PushNotifications />}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">Your Bookmarks</h2>
              {!resolvedUser.is_guest && (
                <SetBookmarksVisability
                  userId={profileIdentifier}
                  bookmarksVisibility={resolvedUser.bookmarks_visibility}
                />
              )}
              <BookmarksList
                bookmarks={resolvedBookmarks}
                fosdemData={resolvedFosdemData}
                year={year}
                loading={resolvedBookmarksLoading}
                day={day}
                view={view}
                tab={tab}
                showConflicts={true}
                defaultViewMode="schedule"
                showViewMode={false}
                user={resolvedUser}
                onCreateBookmark={onCreateBookmark}
                title="Your Scheduled Bookmarks"
              />
            </div>
          </div>
        </div>
      </SectionStack>
    </PageShell>
  );
}
