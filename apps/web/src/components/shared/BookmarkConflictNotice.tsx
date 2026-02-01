"use client";

import { useMemo, useState } from "react";
import { useSearch } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { useFosdemData } from "~/hooks/use-fosdem-data";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Icons } from "~/components/shared/Icons";
import { useSession } from "~/hooks/use-session";
import { useIsClient } from "~/hooks/use-is-client";
import { constants } from "~/constants";
import {
  getLocalBookmarks,
  getSyncQueue,
  removeLocalBookmark,
  saveLocalBookmark,
  updateLocalBookmark,
  removeFromSyncQueue,
  type LocalBookmark,
} from "~/lib/localStorage";
import {
  createBookmark,
  deleteBookmark,
  getBookmarks,
} from "~/server/functions/bookmarks";
import type { Bookmark } from "~/server/db/schema";
import { bookmarkQueryKeys } from "~/lib/query-keys";
import { normalizeServerActionResult } from "~/lib/backgroundSync/utils";
import { generateBookmarkId } from "~/lib/bookmark-id";
import { withBookmarkSyncLock } from "~/lib/backgroundSync/bookmarkSyncLock";
import type { Person } from "~/types/fosdem";

const iconClass = "h-4 w-4 text-amber-600 dark:text-amber-300";

function normalizeBookmarkType(type: string) {
  return type.startsWith("bookmark_") ? type.replace("bookmark_", "") : type;
}

function formatBookmarkType(type: string) {
  const normalized = normalizeBookmarkType(type);
  switch (normalized) {
    case "event":
      return "Event";
    case "track":
      return "Track";
    case "speaker":
      return "Speaker";
    case "room":
      return "Room";
    default:
      return normalized;
  }
}

type BaseConflict = {
  id: string;
  slug: string;
  year: number;
  type: string;
};

type LocalOnlyConflict = BaseConflict & {
  kind: "local-only";
  local: LocalBookmark;
  server?: undefined;
};

type ServerOnlyConflict = BaseConflict & {
  kind: "server-only";
  server: Bookmark;
  local?: undefined;
};

type MismatchConflict = BaseConflict & {
  kind: "mismatch";
  local: LocalBookmark;
  server: Bookmark;
};

type BookmarkConflict = LocalOnlyConflict | ServerOnlyConflict | MismatchConflict;

type ConflictWithLocal = LocalOnlyConflict | MismatchConflict;

export function BookmarkConflictNotice() {
  const { year } = useSearch({ strict: false });
  const selectedYear = Number(year) || constants.DEFAULT_YEAR;

  const isClient = useIsClient();
  const { data: user, isLoading: authLoading } = useSession();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const getBookmarksFromServer = useServerFn(getBookmarks);
  const createBookmarkOnServer = useServerFn(createBookmark);
  const deleteBookmarkOnServer = useServerFn(deleteBookmark);

  const localQueryKey = bookmarkQueryKeys.local(selectedYear);
  const serverQueryKey = bookmarkQueryKeys.list(selectedYear, user?.id);

  const { data: localBookmarks, isLoading: localLoading } = useQuery({
    queryKey: localQueryKey,
    queryFn: () => getLocalBookmarks(selectedYear),
    staleTime: 1000 * 60 * 5,
    gcTime: 10 * 60 * 1000,
    enabled: isClient,
  });

  const localBookmarkVersion = useMemo(() => {
    if (!localBookmarks) return "pending";
    return localBookmarks
      .map((bookmark) =>
        [
          bookmark.id,
          bookmark.updated_at ?? "",
          bookmark.status,
          bookmark.serverId ?? "",
        ].join(":"),
      )
      .join("|");
  }, [localBookmarks]);

  const { data: syncQueue = [] } = useQuery({
    queryKey: ["bookmark-sync-queue", localBookmarkVersion],
    queryFn: getSyncQueue,
    enabled: isClient,
    staleTime: 0,
  });

  const { data: serverBookmarks, isLoading: serverLoading } = useQuery({
    queryKey: serverQueryKey,
    queryFn: async () => {
      if (!user?.id) return [];

      return getBookmarksFromServer({
        data: { year: selectedYear, status: "favourited" },
      });
    },
    enabled: Boolean(user?.id) && isClient,
    staleTime: 1000 * 60 * 5,
  });

  const pendingLocalIds = useMemo(() => {
    return new Set(
      syncQueue.filter((item) => item.type === "bookmark").map((item) => item.id),
    );
  }, [syncQueue]);

  const pendingServerIds = useMemo(() => {
    const ids = new Set<string>();
    syncQueue
      .filter((item) => item.type === "bookmark")
      .forEach((item) => {
        const serverId = item.data?.serverId;
        if (serverId !== undefined && serverId !== null) {
          ids.add(String(serverId));
        }
      });
    return ids;
  }, [syncQueue]);

  const conflicts = useMemo<BookmarkConflict[]>(() => {
    if (!user?.id) return [];
    if (!localBookmarks || !serverBookmarks) return [];

    const localEntries = localBookmarks.filter((bookmark) => bookmark.status === "favourited");
    const localMap = new Map(localEntries.map((bookmark) => [bookmark.slug, bookmark]));
    const serverMap = new Map(serverBookmarks.map((bookmark) => [bookmark.slug, bookmark]));

    const detected: BookmarkConflict[] = [];

    for (const local of localEntries) {
      if (pendingLocalIds.has(local.id)) {
        continue;
      }
      const server = serverMap.get(local.slug);
      if (!server) {
        detected.push({
          id: local.id,
          slug: local.slug,
          year: local.year,
          type: local.type,
          local,
          kind: "local-only",
        });
        continue;
      }

      if (local.status !== server.status) {
        detected.push({
          id: local.id,
          slug: local.slug,
          year: local.year,
          type: local.type,
          local,
          server,
          kind: "mismatch",
        });
      }
    }

    for (const server of serverBookmarks) {
      if (pendingServerIds.has(String(server.id))) {
        continue;
      }
      if (!localMap.has(server.slug)) {
        detected.push({
          id: server.id,
          slug: server.slug,
          year: server.year,
          type: server.type,
          server,
          kind: "server-only",
        });
      }
    }

    return detected;
  }, [
    localBookmarks,
    pendingLocalIds,
    pendingServerIds,
    serverBookmarks,
    user?.id,
  ]);

  const { fosdemData } = useFosdemData({
    year: selectedYear,
    enabled: isClient && Boolean(user?.id) && (isOpen || conflicts.length > 0),
  });

  const eventIdLookup = useMemo(() => {
    const map = new Map<string, string>();
    if (fosdemData?.events) {
      Object.entries(fosdemData.events).forEach(([slug, event]) => {
        if (event?.id) map.set(String(event.id), slug);
      });
    }
    return map;
  }, [fosdemData]);

  const trackIdLookup = useMemo(() => {
    const map = new Map<string, string>();
    if (fosdemData?.tracks) {
      Object.entries(fosdemData.tracks).forEach(([slug, track]) => {
        if (track?.id) map.set(String(track.id), slug);
      });
    }
    return map;
  }, [fosdemData]);

  const personLookup = useMemo(() => {
    const map = new Map<string, Person>();
    if (fosdemData?.persons) {
      Object.values(fosdemData.persons).forEach((person) => {
        if (person.id) map.set(String(person.id), person);
        if (person.slug) map.set(person.slug, person);
      });
    }
    return map;
  }, [fosdemData]);

  const getConflictLabel = (conflict: BookmarkConflict) => {
    const normalizedType = normalizeBookmarkType(conflict.type);

    if (!fosdemData) {
      return conflict.slug;
    }

    switch (normalizedType) {
      case "event": {
        const resolvedSlug = fosdemData.events[conflict.slug]
          ? conflict.slug
          : eventIdLookup.get(conflict.slug);
        const event = resolvedSlug ? fosdemData.events[resolvedSlug] : undefined;
        return event?.title ?? conflict.slug;
      }
      case "track": {
        const resolvedSlug = fosdemData.tracks[conflict.slug]
          ? conflict.slug
          : trackIdLookup.get(conflict.slug);
        const track = resolvedSlug ? fosdemData.tracks[resolvedSlug] : undefined;
        return track?.name ?? conflict.slug;
      }
      case "room": {
        return fosdemData.rooms[conflict.slug]?.name ?? conflict.slug;
      }
      case "speaker": {
        return personLookup.get(conflict.slug)?.name ?? conflict.slug;
      }
      default:
        return conflict.slug;
    }
  };

  const bannerVisible =
    isClient &&
    !authLoading &&
    Boolean(user?.id) &&
    !localLoading &&
    !serverLoading &&
    conflicts.length > 0;

  const localOnlyConflicts = useMemo(
    () => conflicts.filter((conflict): conflict is LocalOnlyConflict => conflict.kind === "local-only"),
    [conflicts],
  );

  const serverOnlyConflicts = useMemo(
    () => conflicts.filter((conflict): conflict is ServerOnlyConflict => conflict.kind === "server-only"),
    [conflicts],
  );

  const mismatchConflicts = useMemo(
    () => conflicts.filter((conflict): conflict is MismatchConflict => conflict.kind === "mismatch"),
    [conflicts],
  );

  const setProcessing = (id: string, isProcessing: boolean) => {
    setProcessingIds((prev) => {
      const next = new Set(prev);
      if (isProcessing) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const setProcessingMany = (ids: string[], isProcessing: boolean) => {
    setProcessingIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => {
        if (isProcessing) {
          next.add(id);
        } else {
          next.delete(id);
        }
      });
      return next;
    });
  };

  const runWithProcessing = async (ids: string[], action: () => Promise<void>) => {
    setProcessingMany(ids, true);
    try {
      await action();
    } finally {
      setProcessingMany(ids, false);
    }
  };

  const invalidateBookmarks = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: localQueryKey }),
      queryClient.invalidateQueries({ queryKey: serverQueryKey }),
    ]);
  };

  const updateServer = async (conflict: ConflictWithLocal) => {
    if (!user?.id) return;
    try {
      await withBookmarkSyncLock(async () => {
        const normalizedType = normalizeBookmarkType(conflict.local.type);
        const response = await createBookmarkOnServer({
          data: {
            year: conflict.local.year,
            type: normalizedType,
            slug: conflict.local.slug,
            status: conflict.local.status,
          },
        });

        const result = normalizeServerActionResult(response, "Failed to update bookmark");
        if (!result.success) {
          throw new Error(result.error ?? "Failed to update bookmark");
        }

        await updateLocalBookmark(
          conflict.local.id,
          {
            serverId: generateBookmarkId(
              Number(user.id),
              conflict.local.year,
              conflict.local.slug,
            ),
          },
          true,
        );

        await removeFromSyncQueue(conflict.local.id);
        await invalidateBookmarks();
      });
    } catch (error) {
      console.error("Failed to update server bookmark:", error);
    }
  };

  const removeLocal = async (conflict: ConflictWithLocal) => {
    try {
      await withBookmarkSyncLock(async () => {
        await removeLocalBookmark(conflict.local.id, true);
        await removeFromSyncQueue(conflict.local.id);
        await invalidateBookmarks();
      });
    } catch (error) {
      console.error("Failed to remove local bookmark:", error);
    }
  };

  const removeServer = async (conflict: ServerOnlyConflict) => {
    try {
      await withBookmarkSyncLock(async () => {
        const response = await deleteBookmarkOnServer({
          data: { id: conflict.server.id },
        });

        const result = normalizeServerActionResult(response, "Failed to delete bookmark");
        if (!result.success && result.statusCode !== 404) {
          throw new Error(result.error ?? "Failed to delete bookmark");
        }

        await invalidateBookmarks();
      });
    } catch (error) {
      console.error("Failed to delete server bookmark:", error);
    }
  };

  const addToLocal = async (conflict: ServerOnlyConflict) => {
    try {
      await withBookmarkSyncLock(async () => {
        await saveLocalBookmark(
          {
            year: conflict.server.year,
            slug: conflict.server.slug,
            type: normalizeBookmarkType(conflict.server.type),
            status: conflict.server.status,
            serverId: conflict.server.id,
            watch_later: conflict.server.watch_later ?? null,
          },
          true,
        );

        await invalidateBookmarks();
      });
    } catch (error) {
      console.error("Failed to save local bookmark:", error);
    }
  };

  const handleUpdateServer = async (conflict: ConflictWithLocal) => {
    await runWithProcessing([conflict.id], async () => {
      await updateServer(conflict);
    });
  };

  const handleRemoveLocal = async (conflict: ConflictWithLocal) => {
    await runWithProcessing([conflict.id], async () => {
      await removeLocal(conflict);
    });
  };

  const handleRemoveServer = async (conflict: ServerOnlyConflict) => {
    await runWithProcessing([conflict.id], async () => {
      await removeServer(conflict);
    });
  };

  const handleAddToLocal = async (conflict: ServerOnlyConflict) => {
    await runWithProcessing([conflict.id], async () => {
      await addToLocal(conflict);
    });
  };

  const handleUpdateServerGroup = async (group: ConflictWithLocal[]) => {
    if (group.length === 0) return;
    const ids = group.map((conflict) => conflict.id);
    await runWithProcessing(ids, async () => {
      for (const conflict of group) {
        await updateServer(conflict);
      }
    });
  };

  const handleRemoveLocalGroup = async (group: ConflictWithLocal[]) => {
    if (group.length === 0) return;
    const ids = group.map((conflict) => conflict.id);
    await runWithProcessing(ids, async () => {
      for (const conflict of group) {
        await removeLocal(conflict);
      }
    });
  };

  const handleRemoveServerGroup = async (group: ServerOnlyConflict[]) => {
    if (group.length === 0) return;
    const ids = group.map((conflict) => conflict.id);
    await runWithProcessing(ids, async () => {
      for (const conflict of group) {
        await removeServer(conflict);
      }
    });
  };

  const handleAddToLocalGroup = async (group: ServerOnlyConflict[]) => {
    if (group.length === 0) return;
    const ids = group.map((conflict) => conflict.id);
    await runWithProcessing(ids, async () => {
      for (const conflict of group) {
        await addToLocal(conflict);
      }
    });
  };

  if (!bannerVisible) {
    return null;
  }

  const renderConflictCard = (conflict: BookmarkConflict) => {
    const isProcessing = processingIds.has(conflict.id);
    const typeLabel = formatBookmarkType(conflict.type);
    const kindLabel =
      conflict.kind === "local-only"
        ? "Local only"
        : conflict.kind === "server-only"
          ? "Server only"
          : "Mismatch";

    return (
      <div
        key={conflict.id}
        className="rounded-xl border border-border/60 bg-background/80 p-4 shadow-sm"
      >
        <div className="flex flex-col gap-3 sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-foreground">
                {typeLabel}: {getConflictLabel(conflict)}
              </p>
              <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                {kindLabel}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {conflict.kind === "local-only"
                ? "Saved locally but not on your account."
                : conflict.kind === "server-only"
                  ? "Saved on your account but not on this device."
                  : "Local and server copies don't match."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end sm:justify-start sm:pt-1">
            {conflict.kind === "local-only" && (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleUpdateServer(conflict)}
                  disabled={isProcessing}
                >
                  Update server
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleRemoveLocal(conflict)}
                  disabled={isProcessing}
                >
                  Remove local
                </Button>
              </>
            )}
            {conflict.kind === "server-only" && (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleAddToLocal(conflict)}
                  disabled={isProcessing}
                >
                  Keep server
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleRemoveServer(conflict)}
                  disabled={isProcessing}
                >
                  Remove server
                </Button>
              </>
            )}
            {conflict.kind === "mismatch" && (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleUpdateServer(conflict)}
                  disabled={isProcessing}
                >
                  Keep local
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleRemoveLocal(conflict)}
                  disabled={isProcessing}
                >
                  Keep server
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="border-b border-border/70 bg-gradient-to-r from-amber-50/80 via-background to-amber-50/80 dark:from-amber-950/40 dark:via-background dark:to-amber-950/40">
      <div className="container py-4">
        <div className="relative overflow-hidden rounded-2xl border border-amber-200/70 bg-background/70 px-4 py-3 shadow-sm backdrop-blur dark:border-amber-900/60 dark:bg-background/30">
          <div className="absolute left-0 top-0 h-full w-1.5 bg-amber-400/80 dark:bg-amber-400/50" />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-700 shadow-inner dark:bg-amber-900/60 dark:text-amber-200">
                <Icons.alertTriangle className={iconClass} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-base font-semibold text-foreground">Bookmark sync needs attention</p>
                  <Badge variant="secondary" className="rounded-full text-[11px] uppercase tracking-wide">
                    {conflicts.length} issue{conflicts.length === 1 ? "" : "s"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  We found {conflicts.length} bookmark{conflicts.length === 1 ? "" : "s"} that{" "}
                  {conflicts.length === 1 ? "doesn't" : "don't"} match your account for {selectedYear}.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => setIsOpen(true)}
              className="h-9 px-4"
            >
              Resolve conflicts
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="grid-rows-[auto_1fr_auto] sm:max-w-2xl max-h-[85vh] overflow-hidden">
          <DialogHeader className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-200">
                <Icons.alertTriangle className={iconClass} />
              </div>
              <div>
                <DialogTitle>Resolve bookmark conflicts</DialogTitle>
                <DialogDescription>
                  Choose how you want to reconcile bookmarks between this device and your account.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-5 min-h-0 overflow-y-auto pr-2">
            {localOnlyConflicts.length > 0 && (
              <section className="space-y-3">
                <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Local only ({localOnlyConflicts.length})
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Saved locally but not on your account.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleUpdateServerGroup(localOnlyConflicts)}
                        disabled={localOnlyConflicts.some((conflict) =>
                          processingIds.has(conflict.id),
                        )}
                      >
                        Sync all to server
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRemoveLocalGroup(localOnlyConflicts)}
                        disabled={localOnlyConflicts.some((conflict) =>
                          processingIds.has(conflict.id),
                        )}
                      >
                        Delete all local copies
                      </Button>
                    </div>
                  </div>
                </div>
                {localOnlyConflicts.map(renderConflictCard)}
              </section>
            )}

            {serverOnlyConflicts.length > 0 && (
              <section className="space-y-3">
                <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Server only ({serverOnlyConflicts.length})
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Saved on your account but not on this device.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleAddToLocalGroup(serverOnlyConflicts)}
                        disabled={serverOnlyConflicts.some((conflict) =>
                          processingIds.has(conflict.id),
                        )}
                      >
                        Save all to device
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRemoveServerGroup(serverOnlyConflicts)}
                        disabled={serverOnlyConflicts.some((conflict) =>
                          processingIds.has(conflict.id),
                        )}
                      >
                        Delete all server copies
                      </Button>
                    </div>
                  </div>
                </div>
                {serverOnlyConflicts.map(renderConflictCard)}
              </section>
            )}

            {mismatchConflicts.length > 0 && (
              <section className="space-y-3">
                <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Mismatch ({mismatchConflicts.length})
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Local and server copies don't match.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleUpdateServerGroup(mismatchConflicts)}
                        disabled={mismatchConflicts.some((conflict) =>
                          processingIds.has(conflict.id),
                        )}
                      >
                        Prefer local for all
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRemoveLocalGroup(mismatchConflicts)}
                        disabled={mismatchConflicts.some((conflict) =>
                          processingIds.has(conflict.id),
                        )}
                      >
                        Prefer server for all
                      </Button>
                    </div>
                  </div>
                </div>
                {mismatchConflicts.map(renderConflictCard)}
              </section>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
