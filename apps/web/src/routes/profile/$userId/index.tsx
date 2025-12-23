import { createFileRoute, Navigate } from "@tanstack/react-router";

import { useUserId } from "~/hooks/use-user-id";
import { PageHeader } from "~/components/PageHeader";
import { ConferenceBadge } from "~/components/ConferenceBadge";
import { Spinner } from "~/components/Spinner";
import { constants } from "~/constants";
import { BookmarksList } from "~/components/Bookmarks/BookmarksList";
import { useUserBookmarks } from "~/hooks/use-user-bookmarks";
import { useFosdemData } from "~/hooks/use-fosdem-data";
import { buildHomeLink } from "~/lib/link-builder";
import { generateCommonSEOTags } from "~/utils/seo-generator";

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
  validateSearch: ({ year }: { year: number }) => ({
    year: (constants.AVAILABLE_YEARS.includes(year) && year) || constants.DEFAULT_YEAR,
  }),
  loaderDeps: ({ search: { year } }) => ({ year }),
  loader: async ({ deps: { year } }) => {
    return {
      year,
    };
  },
});

function ProfilePage() {
  const { year } = Route.useLoaderData();

  const { user, loading } = useUserId({
    userId: Route.useParams().userId,
  });

  const { bookmarks, loading: bookmarksLoading } = useUserBookmarks({
    year,
    userId: Route.useParams().userId,
  });

  const { fosdemData } = useFosdemData({ year });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!user) {
    return <Navigate {...buildHomeLink()} />;
  }

  return (
    <div className="min-h-screen">
      <div className="relative py-6 lg:py-10">
        <PageHeader heading="Profile" displayHeading={false} year={year} />
        <div className="space-y-8">
          <div className="flex flex-col lg:flex-row items-start gap-8">
            <div className="w-full lg:w-auto lg:max-w-md">
              <ConferenceBadge user={user} conferenceYear={year} />
            </div>

            {user.bookmarks_visibility === "public" ? (
              <div className="w-full lg:flex-1 space-y-8">
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-foreground">Shared Bookmarks</h2>
                  <BookmarksList
                    bookmarks={bookmarks}
                    fosdemData={fosdemData}
                    year={year}
                    loading={bookmarksLoading}
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
      </div>
    </div>
  );
}
