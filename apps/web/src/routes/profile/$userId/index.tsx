import { createFileRoute, Navigate } from "@tanstack/react-router";

import { useUserId } from "~/hooks/use-user-id";
import { PageHeader } from "~/components/shared/PageHeader";
import { ConferenceBadge } from "~/components/Profile/ConferenceBadge";
import { constants } from "~/constants";
import { BookmarksList } from "~/components/Bookmarks/BookmarksList";
import { useUserBookmarks } from "~/hooks/use-user-bookmarks";
import { useFosdemData } from "~/hooks/use-fosdem-data";
import { buildHomeLink } from "~/lib/link-builder";
import { generateCommonSEOTags } from "~/utils/seo-generator";
import { PageShell } from "~/components/shared/PageShell";
import { RouteLoadingState } from "~/components/shared/RouteLoadingState";
import { NotFound } from "~/components/shared/NotFound";
import { getAllData } from "~/server/functions/fosdem";
import { getUserBookmarks } from "~/server/functions/bookmarks";
import { getUserDetails } from "~/server/functions/user";
import { useIsClient } from "~/hooks/use-is-client";

export const Route = createFileRoute("/profile/$userId/")({
  component: ProfilePage,
  head: () => ({
    meta: [
      ...generateCommonSEOTags({
        title: "Profile | FOSDEM PWA",
        description: "View FOSDEM conference schedule and bookmarks.",
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
  loader: async ({ params, deps: { year } }) => {
    const userId = params.userId;
    const fosdemData = await getAllData({ data: { year } });

    try {
      const user = await getUserDetails({ data: { userId } });
      const serverBookmarks = user?.bookmarks_visibility === "public"
        ? await getUserBookmarks({ data: { year, userId } })
        : [];

      return {
        year,
        fosdemData,
        user,
        serverBookmarks,
        notFound: false,
      };
    } catch {
      return {
        year,
        fosdemData,
        user: null,
        serverBookmarks: [],
        notFound: true,
      };
    }
  },
});

function ProfilePage() {
  const { year, fosdemData: serverFosdemData, user: serverUser, serverBookmarks, notFound } =
    Route.useLoaderData();
  const { tab: tabRaw, day, view } = Route.useSearch();
  const tab = tabRaw ?? "events";

  const routeUserId = Route.useParams().userId;

  const { user, loading, error } = useUserId({
    userId: routeUserId,
  });

  const shouldLoadBookmarks = Boolean(user) && user?.bookmarks_visibility === "public";
  const { bookmarks, loading: bookmarksLoading } = useUserBookmarks({
    year,
    userId: routeUserId,
    enabled: shouldLoadBookmarks,
  });

  const { fosdemData } = useFosdemData({ year });
  const isClient = useIsClient();
  const hasServerSnapshot = Boolean(serverFosdemData);
  const useServerSnapshot =
    !isClient || loading || bookmarksLoading || !fosdemData || !bookmarks;
  const resolvedUser = useServerSnapshot ? serverUser : user;
  const resolvedBookmarks = useServerSnapshot ? serverBookmarks : bookmarks;
  const resolvedBookmarksLoading = useServerSnapshot ? false : bookmarksLoading;
  const resolvedFosdemData = useServerSnapshot ? serverFosdemData : fosdemData;

  if (notFound) {
    return <NotFound />;
  }

  if (isClient && loading && !hasServerSnapshot) {
    return (
      <RouteLoadingState message="Loading profile..." />
    );
  }

  if (error) {
    return <NotFound />;
  }

  if (!resolvedUser) {
    return <Navigate {...buildHomeLink()} />;
  }

  return (
    <PageShell>
      <PageHeader heading="Profile" displayHeading={false} year={year} />
      <div className="space-y-8">
        <div className="flex flex-col lg:flex-row items-start gap-8">
          <div className="w-full lg:w-auto lg:max-w-md">
            <ConferenceBadge user={resolvedUser} conferenceYear={year} />
          </div>

          {resolvedUser.bookmarks_visibility === "public" ? (
            <div className="w-full lg:flex-1 space-y-8">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">Shared Bookmarks</h2>
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
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 space-y-8">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">Shared Bookmarks</h2>
                <p className="text-sm text-muted-foreground">
                  This user has not shared their bookmarks with you.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
