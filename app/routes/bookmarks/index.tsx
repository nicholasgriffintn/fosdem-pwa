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
  validateSearch: ({ year, day }: { year: number; day?: string }) => ({
    year:
      (constants.AVAILABLE_YEARS.includes(year) && year) ||
      constants.DEFAULT_YEAR,
    day: day || undefined,
  }),
  loaderDeps: ({ search: { year, day } }) => ({ year, day }),
  loader: async ({ deps: { year, day } }) => {
    return {
      year,
      day,
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
  const { year, day } = Route.useLoaderData();
  const { bookmarks, loading, updateBookmark, create: createBookmark } = useBookmarks({ year });
  const { fosdemData } = useFosdemData({ year });
  const { user, loading: authLoading } = useAuth();

  const onCreateBookmark = (bookmark: any) => {
    createBookmark(bookmark);
  };

  return (
    <div className="min-h-screen">
      <div className="relative py-6 lg:py-10">
        <PageHeader heading="Bookmarks" />
        {authLoading || loading ? (
          <div className="flex justify-center items-center">
            <Spinner className="h-8 w-8" />
          </div>
        ) : (
          <>
            {!user?.id ? (
              <div className="flex flex-col">
                <p>You need to sign in to view and manage your bookmarks.</p>
                <Link to="/signin" className="mt-4">
                  <Button>Sign in</Button>
                </Link>
              </div>
            ) : (
              <>
                {!bookmarks ? (
                  <div className="flex justify-center items-center">
                    <p>No bookmarks found</p>
                  </div>
                ) : (
                  <BookmarksList
                    bookmarks={bookmarks}
                    fosdemData={fosdemData}
                    year={year}
                    loading={loading}
                    day={day}
                    onUpdateBookmark={updateBookmark}
                    user={user}
                    onCreateBookmark={onCreateBookmark}
                  />
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
