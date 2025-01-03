import { createAPIFileRoute } from "@tanstack/start/api";
import { eq, and } from "drizzle-orm";

import { db } from "~/server/db";
import { user as userTable } from "~/server/db/schema";
import { bookmark as bookmarkSchema } from "~/server/db/schema";

export const APIRoute = createAPIFileRoute("/api/user/github/$userId/bookmarks/$year")({
	GET: async ({ params }) => {
		const userId = params.userId;
		const year = params.year;

		if (!userId) {
			return Response.json({ error: "User ID is required" }, { status: 400 });
		}

		const user = await db.query.user.findFirst({
			where: eq(userTable.github_username, userId),
		});

		if (!user) {
			return Response.json({ error: "User not found" }, { status: 404 });
		}

		if (user.bookmarks_visibility === "private") {
			return Response.json({ error: "User has private bookmarks" }, { status: 403 });
		}

		const bookmarks = await db.select()
			.from(bookmarkSchema)
			.where(
				and(
					eq(bookmarkSchema.user_id, user.id),
					eq(bookmarkSchema.year, Number(year)),
				),
			);

		return Response.json(bookmarks);
	},
});
