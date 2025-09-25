import { createServerFn } from "@tanstack/start";
import { eq } from "drizzle-orm";

import { db } from "~/server/db";
import { user as userTable } from "~/server/db/schema";
import { getFullAuthSession } from "~/server/auth";

export const changeBookmarksVisibility = createServerFn({
	method: "POST",
})
	.validator((data: { visibility: string }) => {
		if (!["private", "public"].includes(data.visibility)) {
			throw new Error("Invalid value");
		}

		return data;
	})
	.handler(async (ctx: any) => {
		const { user } = await getFullAuthSession();

		if (!user) {
			return null;
		}

		try {
			await db
				.update(userTable)
				.set({
					bookmarks_visibility: ctx.data.visibility,
				})
				.where(eq(userTable.id, user.id));

			return {
				success: true,
			};
		} catch (error) {
			console.error(error);

			throw new Error("Failed to update bookmarks visibility");
		}
	});
