import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";

import { getAllData } from "~/server/functions/fosdem";
import { db } from "~/server/db";
import { bookmark as bookmarkTable } from "~/server/db/schema";
import { getFullAuthSession } from "~/server/auth";
import {
  validateYear,
  upsertBookmark,
  buildIdToSlugMaps,
  generateBookmarkId,
} from "~/server/lib/bookmark-utils";
import {
  csvEscape,
  parseBookmarkImportCsv,
  buildCsvHeader,
} from "~/server/lib/csv-utils";

export const exportBookmarksCsv = createServerFn({
  method: "GET",
})
  .inputValidator((data: { year: number }) => data)
  .handler(async (ctx) => {
    const yearNum = validateYear(ctx.data.year);

    const { user } = await getFullAuthSession();
    if (!user) {
      return { filename: `bookmarks_${yearNum}.csv`, csv: "type,id\n" };
    }

    const [fosdemData, bookmarks] = await Promise.all([
      getAllData({ data: { year: yearNum } }),
      db.query.bookmark.findMany({
        where: and(
          eq(bookmarkTable.user_id, user.id),
          eq(bookmarkTable.year, yearNum),
          eq(bookmarkTable.status, "favourited"),
        ),
      }),
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

    const { user } = await getFullAuthSession();
    if (!user) {
      throw new Error("You must be signed in to import bookmarks");
    }

    const fosdemData = await getAllData({ data: { year: yearNum } });
    const { eventIdToSlug, trackIdToSlug } = buildIdToSlugMaps(fosdemData);
    const rows = parseBookmarkImportCsv(ctx.data.csv);

    let importedEvents = 0;
    let importedTracks = 0;
    const notFound: Array<{ type?: string; id: string }> = [];

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
        await upsertBookmark(
          {
            year: yearNum,
            type: "event",
            slug,
            status: "favourited",
          },
          user.id,
        );
        if (priority !== null) {
          await db
            .update(bookmarkTable)
            .set({ priority })
            .where(eq(bookmarkTable.id, generateBookmarkId(user.id, yearNum, slug)));
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
        await upsertBookmark(
          { year: yearNum, type: "track", slug, status: "favourited" },
          user.id,
        );
        importedTracks++;
        continue;
      }

      const eventSlug = eventIdToSlug.get(id);
      if (eventSlug) {
        await upsertBookmark(
          {
            year: yearNum,
            type: "event",
            slug: eventSlug,
            status: "favourited",
          },
          user.id,
        );
        if (priority !== null) {
          await db
            .update(bookmarkTable)
            .set({ priority })
            .where(eq(bookmarkTable.id, generateBookmarkId(user.id, yearNum, eventSlug)));
        }
        importedEvents++;
        continue;
      }

      const trackSlug = trackIdToSlug.get(id);
      if (trackSlug) {
        await upsertBookmark(
          { year: yearNum, type: "track", slug: trackSlug, status: "favourited" },
          user.id,
        );
        importedTracks++;
        continue;
      }

      notFound.push({ id });
    }

    return {
      success: true,
      importedEvents,
      importedTracks,
      notFoundCount: notFound.length,
    };
  });
