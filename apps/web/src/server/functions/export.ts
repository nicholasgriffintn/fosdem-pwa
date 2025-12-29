import { createServerFn } from "@tanstack/react-start";

import { getAllData } from "~/server/functions/fosdem";
import { getAuthUser } from "~/server/lib/auth-middleware";
import {
  validateYear,
  buildIdToSlugMaps,
} from "~/server/lib/bookmark-utils";
import {
  csvEscape,
  parseBookmarkImportCsv,
  buildCsvHeader,
} from "~/server/lib/csv-utils";
import {
  findBookmarksByUserAndStatus,
  upsertBookmark,
  updateBookmark,
  generateBookmarkId,
} from "~/server/repositories/bookmark-repository";

export const exportBookmarksCsv = createServerFn({
  method: "GET",
})
  .inputValidator((data: { year: number }) => data)
  .handler(async (ctx) => {
    const yearNum = validateYear(ctx.data.year);

    const user = await getAuthUser();
    if (!user) {
      return { filename: `bookmarks_${yearNum}.csv`, csv: "type,id\n" };
    }

    const [fosdemData, bookmarks] = await Promise.all([
      getAllData({ data: { year: yearNum } }),
      findBookmarksByUserAndStatus(user.id, yearNum, "favourited"),
    ]);

    const lines: string[] = [buildCsvHeader()];
    for (const b of bookmarks) {
      const normalizedType = b.type.replace(/^bookmark_/, "");
      if (normalizedType === "event") {
        const event = fosdemData?.events?.[b.slug];
        lines.push(
          [
            "event",
            csvEscape(event?.id ?? ""),
            csvEscape(b.slug),
            csvEscape(event?.title ?? ""),
            csvEscape(event?.trackKey ?? ""),
            csvEscape(event?.room ?? ""),
            csvEscape(event?.day ?? ""),
            csvEscape(event?.startTime ?? ""),
            csvEscape(event?.duration ?? ""),
            csvEscape(b.priority ?? ""),
            csvEscape(b.status ?? ""),
          ].join(","),
        );
        continue;
      }

      if (normalizedType === "track") {
        const track = fosdemData?.tracks?.[b.slug];
        lines.push(
          [
            "track",
            csvEscape(track?.id ?? ""),
            csvEscape(b.slug),
            csvEscape(track?.name ?? ""),
            "",
            csvEscape(track?.room ?? ""),
            csvEscape(track?.day ?? ""),
            "",
            "",
            "",
            csvEscape(b.status ?? ""),
          ].join(","),
        );
      }
    }

    return {
      filename: `bookmarks_${yearNum}.csv`,
      csv: `${lines.join("\n")}\n`,
    };
  });

export const importBookmarksCsv = createServerFn({
  method: "POST",
})
  .inputValidator((data: { year: number; csv: string }) => data)
  .handler(async (ctx) => {
    const yearNum = validateYear(ctx.data.year);

    if (!ctx.data.csv || typeof ctx.data.csv !== "string") {
      throw new Error("CSV data is required");
    }

    const user = await getAuthUser();
    if (!user) {
      throw new Error("You must be signed in to import bookmarks");
    }

    const fosdemData = await getAllData({ data: { year: yearNum } });
    const { eventIdToSlug, trackIdToSlug } = buildIdToSlugMaps(fosdemData);
    const rows = parseBookmarkImportCsv(ctx.data.csv);

    let importedEvents = 0;
    let importedTracks = 0;
    const notFound: Array<{ type?: string; id: string }> = [];

    const upsertOperations: Array<Promise<unknown>> = [];
    const updateOperations: Array<Promise<unknown>> = [];

    for (const row of rows) {
      const id = String(row.id).trim();
      if (!id) continue;
      const priority = typeof row.priority === "number" ? row.priority : null;

      if (row.type === "event") {
        const slug = eventIdToSlug.get(id);
        if (!slug) {
          notFound.push({ type: "event", id });
          continue;
        }
        upsertOperations.push(upsertBookmark(user.id, yearNum, "event", slug, "favourited"));
        if (priority !== null) {
          updateOperations.push(updateBookmark(generateBookmarkId(user.id, yearNum, slug), user.id, { priority }));
        }
        importedEvents++;
        continue;
      }

      if (row.type === "track") {
        const slug = trackIdToSlug.get(id);
        if (!slug) {
          notFound.push({ type: "track", id });
          continue;
        }
        upsertOperations.push(upsertBookmark(user.id, yearNum, "track", slug, "favourited"));
        importedTracks++;
        continue;
      }

      const eventSlug = eventIdToSlug.get(id);
      if (eventSlug) {
        upsertOperations.push(upsertBookmark(user.id, yearNum, "event", eventSlug, "favourited"));
        if (priority !== null) {
          updateOperations.push(updateBookmark(generateBookmarkId(user.id, yearNum, eventSlug), user.id, { priority }));
        }
        importedEvents++;
        continue;
      }

      const trackSlug = trackIdToSlug.get(id);
      if (trackSlug) {
        upsertOperations.push(upsertBookmark(user.id, yearNum, "track", trackSlug, "favourited"));
        importedTracks++;
        continue;
      }

      notFound.push({ id });
    }

    await Promise.all([...upsertOperations, ...updateOperations]);

    return {
      success: true,
      importedEvents,
      importedTracks,
      notFoundCount: notFound.length,
    };
  });
