import { createServerFn } from "@tanstack/react-start";
import { eq, or, sql } from "drizzle-orm";

import { db } from "~/server/db";
import { user as userTable } from "~/server/db/schema";

export const getUserDetails = createServerFn({
	method: "GET",
})
	.inputValidator((data: { userId: string }) => data)
	.handler(async (ctx: any) => {
		const rawUserId = String(ctx.data.userId);
		const normalizedUserId = rawUserId.trim().replace(/^@/, "");
		const normalizedUserIdLower = normalizedUserId.toLowerCase();

		const conditions = [
			eq(sql`lower(${userTable.github_username})`, normalizedUserIdLower),
			eq(sql`lower(${userTable.gitlab_username})`, normalizedUserIdLower),
			eq(sql`lower(${userTable.discord_username})`, normalizedUserIdLower),
			eq(sql`lower(${userTable.mastodon_username})`, normalizedUserIdLower),
			eq(sql`lower(${userTable.mastodon_acct})`, normalizedUserIdLower),
		];

		const user = await db.query.user.findFirst({
			where: or(...conditions),
		});

		if (!user) {
			throw new Error("User not found");
		}

		return user;
	});
