import { createAPIFileRoute } from "@tanstack/start/api";
import { and, eq } from "drizzle-orm";

import { getFullAuthSession } from "~/server/auth";
import { db } from "~/server/db";
import { bookmark } from "~/server/db/schema";

export const APIRoute = createAPIFileRoute("/api/bookmarks/$year")({
	GET: async ({ params }) => {
		const { year } = params;

		const { user } = await getFullAuthSession();

		if (!user) {
			return Response.json({ error: "Unauthorized" }, { status: 401 });
		}

		const bookmarkData = await db.query.bookmark.findMany({
			where: and(
				eq(bookmark.user_id, user.id),
				eq(bookmark.year, Number.parseInt(year)),
			),
		});

		return Response.json(bookmarkData);
	},
	POST: async ({ params, request }) => {
		const { year } = params;
		const { type, slug, status } = await request.json();

		if (!type || !slug || !status) {
			return Response.json({ error: "Invalid request" }, { status: 400 });
		}

		const { user } = await getFullAuthSession();

		if (!user) {
			return Response.json({ error: "Unauthorized" }, { status: 401 });
		}

		const existingBookmark = await db.query.bookmark.findFirst({
			where: and(
				eq(bookmark.user_id, user.id),
				eq(bookmark.year, Number.parseInt(year)),
				eq(bookmark.slug, slug),
			),
		});

		try {
			if (existingBookmark) {
				await db
					.update(bookmark)
					.set({
						status,
					})
					.where(eq(bookmark.id, existingBookmark.id));
			} else {
				await db
					.insert(bookmark)
					.values({
						id: `${user.id}_${year}_${slug}`,
						slug,
						type: `bookmark_${type}`,
						year: Number.parseInt(year),
						status,
						user_id: user.id,
					})
					.returning();
			}

			return Response.json({
				success: true,
			});
		} catch (error) {
			console.error(error);

			return Response.json({ error: "Failed to save bookmark" }, { status: 500 });
		}
	},
});
