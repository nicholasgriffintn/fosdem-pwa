import { createFileRoute, Link } from "@tanstack/react-router";

import { PageHeader } from "~/components/PageHeader";
import { useBookmarks } from "~/hooks/use-bookmarks";
import { constants } from "~/constants";
import { useFosdemData } from "~/hooks/use-fosdem-data";
import { BookmarksList } from "~/components/Bookmarks/BookmarksList";
import { useAuth } from "~/hooks/use-auth";
import { Spinner } from "~/components/Spinner";
import { Button } from "~/components/ui/button";

export const Route = createFileRoute("/bookmarks/")({
  component: BookmarksHome,
  validateSearch: ({ year }: { year: number }) => ({
    year:
      (constants.AVAILABLE_YEARS.includes(year) && year) ||
      constants.DEFAULT_YEAR,
  }),
  loaderDeps: ({ search: { year } }) => ({ year }),
  loader: async ({ deps: { year } }) => {
    return {
      year,
    };
  },
  head: () => ({
    meta: [
      {
        title: "Bookmarks | FOSDEM PWA",
        description: "Bookmarks from FOSDEM",
      },
    ],
  }),
});

function BookmarksHome() {
  const { year } = Route.useLoaderData();
  const { bookmarks, loading } = useBookmarks({ year });
  const { fosdemData } = useFosdemData({ year });
  const { user, loading: authLoading } = useAuth();

  return (
    <div className="min-h-screen">
      <div className="relative py-6 lg:py-10">
        <PageHeader heading="Bookmarks" />
        {authLoading ? (
          <div className="flex justify-center items-center h-screen">
            <Spinner />
          </div>
        ) : (
          <>
            {!user ? (
              <div className="flex flex-col">
                <p>You need to sign in to view and manage your bookmarks.</p>
                <Link to="/signin" className="mt-4">
                  <Button>Sign in</Button>
                </Link>
              </div>
            ) : (
              <BookmarksList
                bookmarks={bookmarks}
                fosdemData={fosdemData}
                year={year}
                loading={loading}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
