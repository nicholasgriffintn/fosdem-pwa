import { createFileRoute, Link } from "@tanstack/react-router";

import { PageHeader } from "~/components/shared/PageHeader";
import { PageShell } from "~/components/shared/PageShell";
import { EmptyStateCard } from "~/components/shared/EmptyStateCard";
import { Button } from "~/components/ui/button";
import { constants } from "~/constants";
import { generateCommonSEOTags } from "~/utils/seo-generator";
import { getAllData } from "~/server/functions/fosdem";
import { getWatchLaterList } from "~/server/functions/watch-later";
import { WatchLaterList } from "~/components/WatchLater/WatchLaterList";
import { useWatchLater } from "~/hooks/use-watch-later";
import { useFosdemData } from "~/hooks/use-fosdem-data";
import { useIsClient } from "~/hooks/use-is-client";
import { RouteLoadingState } from "~/components/shared/RouteLoadingState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

export const Route = createFileRoute("/watch-later/")({
  component: WatchLaterPage,
  validateSearch: ({
    year,
    tab,
  }: {
    year: number;
    tab?: "all" | "unwatched" | "watching" | "watched";
  }) => ({
    year:
      (constants.AVAILABLE_YEARS.includes(year) && year) ||
      constants.DEFAULT_YEAR,
    tab: tab || "all",
  }),
  loaderDeps: ({ search: { year } }) => ({ year }),
  loader: async ({ deps: { year } }) => {
    const fosdemData = await getAllData({ data: { year } });
    const watchLaterList = await getWatchLaterList({ data: { year } });

    return {
      year,
      fosdemData,
      serverWatchLater: watchLaterList,
    };
  },
  head: () => ({
    meta: [
      ...generateCommonSEOTags({
        title: "Watch Later | FOSDEM PWA",
        description: "Your watch later queue for FOSDEM recordings",
      }),
    ],
  }),
});

function WatchLaterPage() {
  const { year, fosdemData: serverFosdemData, serverWatchLater } =
    Route.useLoaderData();
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();

  const { watchLaterList, loading, toggle, markAsWatched } = useWatchLater({
    year,
  });
  const { fosdemData } = useFosdemData({ year });
  const isClient = useIsClient();

  const hasServerSnapshot = Boolean(serverFosdemData);
  const useServerSnapshot = !isClient || loading || !fosdemData;
  const resolvedWatchLater = useServerSnapshot
    ? serverWatchLater
    : watchLaterList;
  const resolvedFosdemData = useServerSnapshot ? serverFosdemData : fosdemData;
  const resolvedLoading = useServerSnapshot ? false : loading;

  const handleTabChange = (value: string) => {
    navigate({
      search: (prev) => ({
        ...prev,
        tab: value as "all" | "unwatched" | "watching" | "watched",
      }),
    });
  };

  const filteredList =
    tab === "all"
      ? resolvedWatchLater
      : resolvedWatchLater?.filter((item) => item.watch_status === tab);

  if (isClient && loading && !hasServerSnapshot) {
    return <RouteLoadingState message="Loading watch later..." />;
  }

  return (
    <PageShell>
      <PageHeader heading="Watch Later" year={year} />

      {!resolvedWatchLater || resolvedWatchLater.length === 0 ? (
        <EmptyStateCard
          title="No recordings in your queue"
          description="Add events to your watch later queue to keep track of recordings you want to watch."
          actions={
            <Button asChild>
              <Link
                to="/bookmarks"
                search={{ year, day: undefined, view: undefined, tab: undefined }}
                className="no-underline hover:underline"
              >
                View your bookmarks
              </Link>
            </Button>
          }
        />
      ) : (
        <Tabs value={tab} onValueChange={handleTabChange}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">
              All ({resolvedWatchLater.length})
            </TabsTrigger>
            <TabsTrigger value="unwatched">
              Unwatched (
              {
                resolvedWatchLater.filter((i) => i.watch_status === "unwatched")
                  .length
              }
              )
            </TabsTrigger>
            <TabsTrigger value="watching">
              In Progress (
              {
                resolvedWatchLater.filter((i) => i.watch_status === "watching")
                  .length
              }
              )
            </TabsTrigger>
            <TabsTrigger value="watched">
              Watched (
              {
                resolvedWatchLater.filter((i) => i.watch_status === "watched")
                  .length
              }
              )
            </TabsTrigger>
          </TabsList>

          <TabsContent value={tab}>
            <WatchLaterList
              items={filteredList ?? []}
              fosdemData={resolvedFosdemData}
              year={year}
              loading={resolvedLoading}
              onToggleWatchLater={toggle}
              onMarkAsWatched={markAsWatched}
            />
          </TabsContent>
        </Tabs>
      )}
    </PageShell>
  );
}
