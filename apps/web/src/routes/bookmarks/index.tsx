import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { PageHeader } from "~/components/shared/PageHeader";
import { useBookmarks } from "~/hooks/use-bookmarks";
import { useMutateBookmark } from "~/hooks/use-mutate-bookmark";
import { useWatchLater } from "~/hooks/use-watch-later";
import { constants } from "~/constants";
import { useFosdemData } from "~/hooks/use-fosdem-data";
import { BookmarksList } from "~/components/Bookmarks/BookmarksList";
import { useAuth } from "~/hooks/use-auth";
import { EmptyStateCard } from "~/components/shared/EmptyStateCard";
import { useIsClient } from "~/hooks/use-is-client";
import { getAllData } from "~/server/functions/fosdem";
import { useAuthSnapshot } from "~/contexts/AuthSnapshotContext";
import { getBookmarks } from "~/server/functions/bookmarks";
import { exportBookmarksCsv, importBookmarksCsv } from "~/server/functions/export";
import { Button } from "~/components/ui/button";
import { UpgradeNotice } from "~/components/shared/UpgradeNotice";
import { generateCommonSEOTags } from "~/utils/seo-generator";
import { PageShell } from "~/components/shared/PageShell";
import { RouteLoadingState } from "~/components/shared/RouteLoadingState";
import { Icons } from "~/components/shared/Icons";
import { ImportBookmarksSheet } from "~/components/Bookmarks/ImportBookmarksSheet";
import { downloadFile } from "~/utils/file-download";
import type { Bookmark } from "~/server/db/schema";
import type { LocalBookmark } from "~/lib/localStorage";
import { pruneFosdemData } from "~/server/lib/fosdem-prune";

export const Route = createFileRoute("/bookmarks/")({
  component: BookmarksHome,
  validateSearch: ({
    year,
    day,
    view,
    tab,
  }: {
    year: number;
    day?: string;
    view?: string;
    tab?: "all" | "tracks" | "events" | "watch-later";
  }) => ({
    year: (constants.AVAILABLE_YEARS.includes(year) && year) || constants.DEFAULT_YEAR,
    day: day || undefined,
    view: view || undefined,
    tab: tab || undefined,
  }),
  loaderDeps: ({ search: { year, day } }) => ({ year, day }),
  loader: async ({ deps: { year, day } }) => {
    const [fosdemData, serverBookmarks] = await Promise.all([
      getAllData({ data: { year } }),
      getBookmarks({ data: { year, status: "favourited" } }),
    ]);
    const prunedFosdemData = pruneFosdemData(fosdemData, serverBookmarks);
    return {
      year,
      day,
      serverBookmarks,
      fosdemData: prunedFosdemData,
    };
  },
  staleTime: 1000 * 60 * 5, // 5 minutes
  head: () => ({
    meta: [
      ...generateCommonSEOTags({
        title: "Bookmarks | FOSDEM PWA",
        description: "Bookmarks from FOSDEM",
      }),
    ],
  }),
});

function BookmarksHome() {
  const {
    year,
    day,
    serverBookmarks,
    fosdemData: serverFosdemData,
  } = Route.useLoaderData();
  const { view, tab } = Route.useSearch();
  const { user: serverUser } = useAuthSnapshot();
  const { bookmarks, loading } = useBookmarks({
    year,
    initialServerBookmarks: serverBookmarks,
  });
  const { create, update } = useMutateBookmark({ year });
  const { toggle: toggleWatchLater } = useWatchLater({ year });
  const { fosdemData } = useFosdemData({
    year,
    initialData: serverFosdemData,
    initialDataIsPartial: true,
  });
  const { user, loading: authLoading } = useAuth();
  const isClient = useIsClient();
  const hasServerSnapshot = Boolean(serverFosdemData);
  const useServerSnapshot =
    !isClient || loading || authLoading || !fosdemData || !bookmarks;
  const resolvedBookmarks = useServerSnapshot ? serverBookmarks : bookmarks;
  const resolvedLoading = useServerSnapshot ? false : loading;
  const resolvedAuthLoading = useServerSnapshot ? false : authLoading;
  const resolvedFosdemData = useServerSnapshot ? serverFosdemData : fosdemData;
  const resolvedUser = useServerSnapshot ? serverUser : user;
  const resolvedWatchLater = resolvedBookmarks?.filter(
    (bookmark) => bookmark.watch_later === true,
  );
  const resolvedWatchLaterLoading = resolvedLoading;
  const [csvBusy, setCsvBusy] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const exportCsv = useServerFn(exportBookmarksCsv);
  const importCsv = useServerFn(importBookmarksCsv);

  const handleExport = async () => {
    try {
      setCsvBusy(true);
      const result = await exportCsv({ data: { year } });
      downloadFile(result.csv, result.filename);
    } finally {
      setCsvBusy(false);
    }
  };

  const handleImport = async (file: File) => {
    const csv = await file.text();
    setCsvBusy(true);
    try {
      const result = await importCsv({ data: { year, csv } });
      window.alert(
        `Imported ${result.importedEvents} events and ${result.importedTracks} tracks. Not found: ${result.notFoundCount}.`,
      );
      setImportOpen(false);
      window.location.reload();
    } finally {
      setCsvBusy(false);
    }
  };

  const handleCreateBookmark = async (bookmark: any) => {
    await create({
      year,
      slug: bookmark.slug,
      type: bookmark.type,
      status: bookmark.status,
    });
  };

  const handleUpdateBookmark = ({
    id,
    updates,
    serverId,
  }: {
    id: string;
    updates: Partial<Bookmark | LocalBookmark>;
    serverId?: string;
  }) => {
    update(id, updates, serverId);
  };

  return (
    <PageShell>
      <PageHeader heading="Bookmarks" year={year} />
      <ImportBookmarksSheet
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={handleImport}
        disabled={!resolvedUser?.id}
        busy={csvBusy}
      />
      {resolvedUser?.is_guest && (
        <div className="mb-6">
          <UpgradeNotice user={resolvedUser} />
        </div>
      )}
      {isClient && (authLoading || loading) && !hasServerSnapshot && (
        <RouteLoadingState message="Loading bookmarks..." />
      )}
      {!resolvedAuthLoading &&
      !resolvedLoading &&
      (!resolvedBookmarks || resolvedBookmarks.length === 0) ? (
        <EmptyStateCard
          title="No bookmarks yet"
          description={
            <div className="space-y-2">
              <p>Start bookmarking events to see them here.</p>
              {!resolvedUser?.id && (
                <p className="text-sm">
                  If you have JavaScript enabled, your bookmarks will be saved locally in
                  your browser. Sign in to sync across devices or to bookmark without
                  JavaScript.
                </p>
              )}
            </div>
          }
          actions={
            <>
              <Button asChild>
                <Link
                  to="/"
                  search={(prev) => ({ ...prev, year })}
                  className="no-underline hover:underline"
                >
                  Browse schedule
                </Link>
              </Button>
              {!resolvedUser?.id ? (
                <Button asChild variant="secondary">
                  <Link
                    to="/signin"
                    className="text-primary no-underline hover:underline cursor-pointer"
                  >
                    Sign in
                  </Link>
                </Button>
              ) : (
                <ImportButton
                  disabled={!isClient || csvBusy}
                  onClick={() => setImportOpen(true)}
                />
              )}
            </>
          }
        />
      ) : (
        <BookmarksList
          bookmarks={resolvedBookmarks}
          fosdemData={resolvedFosdemData}
          year={year}
          loading={resolvedLoading}
          day={day}
          view={view}
          tab={tab}
          watchLaterItems={resolvedWatchLater}
          watchLaterLoading={resolvedWatchLaterLoading}
          scheduleShowConflictIndicators={false}
          headerActions={
            <BookmarkActions
              onExport={handleExport}
              onImport={() => setImportOpen(true)}
              exportDisabled={!isClient || csvBusy}
              importDisabled={!isClient || csvBusy || !resolvedUser?.id}
              showImportTitle={!resolvedUser?.id}
            />
          }
          onUpdateBookmark={handleUpdateBookmark}
          user={resolvedUser}
          onCreateBookmark={handleCreateBookmark}
          onToggleWatchLater={toggleWatchLater}
        />
      )}
    </PageShell>
  );
}

type BookmarkActionsProps = {
  onExport: () => void;
  onImport: () => void;
  exportDisabled?: boolean;
  importDisabled?: boolean;
  showImportTitle?: boolean;
};

function BookmarkActions({
  onExport,
  onImport,
  exportDisabled,
  importDisabled,
  showImportTitle,
}: BookmarkActionsProps) {
  return (
    <div className="grid grid-cols-2 gap-2 w-full md:flex md:w-auto">
      <Button
        variant="outline"
        disabled={exportDisabled}
        onClick={onExport}
        className="border-emerald-600/30 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-900/50 dark:hover:text-emerald-200"
      >
        <Icons.download className="h-4 w-4" />
        Export
      </Button>
      <ImportButton
        disabled={importDisabled}
        onClick={onImport}
        showTitle={showImportTitle}
      />
    </div>
  );
}

type ImportButtonProps = {
  disabled?: boolean;
  onClick: () => void;
  showTitle?: boolean;
};

function ImportButton({ disabled, onClick, showTitle }: ImportButtonProps) {
  return (
    <Button
      variant="outline"
      disabled={disabled}
      onClick={onClick}
      title={showTitle ? "Sign in to import" : undefined}
      className="border-sky-600/30 text-sky-700 hover:bg-sky-100 hover:text-sky-800 dark:text-sky-300 dark:hover:bg-sky-900/50 dark:hover:text-sky-200"
    >
      <Icons.upload className="h-4 w-4" />
      Import
    </Button>
  );
}
