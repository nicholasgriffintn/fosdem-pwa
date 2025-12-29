import { createFileRoute, Navigate } from "@tanstack/react-router";

import { PageHeader } from "~/components/shared/PageHeader";
import { PageShell } from "~/components/shared/PageShell";
import { SectionStack } from "~/components/shared/SectionStack";
import { Button } from "~/components/ui/button";
import { constants } from "~/constants";
import { generateCommonSEOTags } from "~/utils/seo-generator";
import { getUserStats, getUserStatsHistory } from "~/server/functions/user-stats";
import { YearInReview } from "~/components/Profile/Analytics/YearInReview";
import { ConferenceStats } from "~/components/Profile/Analytics/ConferenceStats";
import { YearComparison } from "~/components/Profile/Analytics/YearComparison";
import { useUserStats, useUserStatsHistory } from "~/hooks/use-user-stats";
import { useProfile } from "~/hooks/use-user-me";
import { useIsClient } from "~/hooks/use-is-client";
import { RouteLoadingState } from "~/components/shared/RouteLoadingState";
import { buildHomeLink } from "~/lib/link-builder";
import { Icons } from "~/components/shared/Icons";
import { useAuthSnapshot } from "~/contexts/AuthSnapshotContext";

export const Route = createFileRoute("/profile/year-in-review")({
  component: YearInReviewPage,
  validateSearch: ({ year }: { year: number }) => ({
    year:
      (constants.AVAILABLE_YEARS.includes(year) && year) ||
      constants.DEFAULT_YEAR,
  }),
  loaderDeps: ({ search: { year } }) => ({ year }),
  loader: async ({ deps: { year } }) => {
    const [stats, history] = await Promise.all([
      getUserStats({ data: { year } }),
      getUserStatsHistory(),
    ]);

    return {
      year,
      serverStats: stats,
      serverHistory: history,
    };
  },
  head: ({ loaderData }) => ({
    meta: [
      ...generateCommonSEOTags({
        title: `Year in Review ${loaderData?.year} | FOSDEM PWA`,
        description: `Your personal FOSDEM ${loaderData?.year} statistics and achievements`,
      }),
    ],
  }),
});

function YearInReviewPage() {
  const { year, serverStats, serverHistory } = Route.useLoaderData();
  const navigate = Route.useNavigate();

  const { user, loading: userLoading } = useProfile();
  const { user: serverUserFromRoot } = useAuthSnapshot();
  const { stats, loading: statsLoading, refresh, refreshing } = useUserStats({ year });
  const { history, loading: historyLoading } = useUserStatsHistory();
  const isClient = useIsClient();

  const hasServerSnapshot = Boolean(serverStats);
  const useServerSnapshot = !isClient || statsLoading || userLoading;
  const resolvedUser = useServerSnapshot ? serverUserFromRoot : user;
  const resolvedStats = useServerSnapshot ? serverStats : stats;
  const resolvedHistory = useServerSnapshot ? serverHistory : history;
  const resolvedLoading = useServerSnapshot ? false : statsLoading;

  if (isClient && userLoading && !hasServerSnapshot) {
    return <RouteLoadingState message="Loading your stats..." />;
  }

  if (!resolvedUser) {
    return <Navigate {...buildHomeLink()} />;
  }

  const handleYearChange = (newYear: number) => {
    navigate({
      search: { year: newYear },
    });
  };

  return (
    <PageShell>
      <PageHeader
        heading="Year in Review"
        year={year}
        breadcrumbs={[{ title: "Profile", href: "/profile" }]}
      />

      <SectionStack>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {[...constants.AVAILABLE_YEARS]
              .reverse()
              .map((y) => (
                <Button
                  key={y}
                  variant={y === year ? "default" : "outline"}
                  size="sm"
                  className="min-w-[72px]"
                  onClick={() => handleYearChange(y)}
                >
                  {y}
                </Button>
              ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refresh()}
            disabled={refreshing}
            className="w-full md:w-auto"
          >
            <Icons.refresh className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh Stats
          </Button>
        </div>

        <YearInReview stats={resolvedStats} user={resolvedUser} year={year} />

        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-foreground">
            Detailed Statistics
          </h3>
          <ConferenceStats stats={resolvedStats} loading={resolvedLoading} />
        </div>

        {resolvedHistory && resolvedHistory.length > 1 && (
          <YearComparison
            history={resolvedHistory}
            loading={historyLoading && !useServerSnapshot}
          />
        )}
      </SectionStack>
    </PageShell>
  );
}
