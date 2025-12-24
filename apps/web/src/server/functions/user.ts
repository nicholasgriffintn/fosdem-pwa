import { createServerFn } from "@tanstack/react-start";

import { findUserByUsername } from "~/server/repositories/user-repository";
import type { User } from "~/server/db/schema";

export const getUserDetails = createServerFn({
	method: "GET",
})
	.inputValidator((data: { userId: string }) => data)
	.handler(async (ctx): Promise<User> => {
		const user = await findUserByUsername(ctx.data.userId);

		if (!user) {
			throw new Error("User not found");
		}

		return user;
	});
