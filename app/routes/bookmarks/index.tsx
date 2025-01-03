import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "~/components/PageHeader";
import { useBookmarks } from "~/hooks/use-bookmarks";
import { constants } from "~/constants";
import { useFosdemData } from "~/hooks/use-fosdem-data";
import { BookmarksList } from "../../components/BookmarksList";

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

  return (
    <div className="min-h-screen">
      <div className="relative py-6 lg:py-10">
        <PageHeader heading="Bookmarks" />
        <BookmarksList
          bookmarks={bookmarks}
          fosdemData={fosdemData}
          year={year}
          loading={loading}
        />
      </div>
    </div>
  );
}
