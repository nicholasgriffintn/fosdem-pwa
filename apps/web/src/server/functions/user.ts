import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";

import { db } from "~/server/db";
import { user as userTable } from "~/server/db/schema";

export const getUserDetails = createServerFn({
	method: "GET",
})
	.validator((data: { userId: string }) => data)
	.handler(async (ctx: any) => {
		const user = await db.query.user.findFirst({
			where: eq(userTable.github_username, ctx.data.userId),
		});

		if (!user) {
			throw new Error("User not found");
		}

		return user;
	});
