import { createServerFn } from "@tanstack/react-start";

import { findUserByUsername } from "~/server/repositories/user-repository";
import { toPublicUser, type PublicUser } from "~/server/lib/public-user";

/**
 * Looks up a user by their public handle.
 *
 * This is reachable without authentication (it backs `/profile/$userId`), so
 * the response is projected down to public fields only.
 */
export const getUserDetails = createServerFn({
	method: "GET",
})
	.validator((data: { userId: string }) => data)
	.handler(async (ctx): Promise<PublicUser> => {
		const user = await findUserByUsername(ctx.data.userId);

		if (!user) {
			throw new Error("User not found");
		}

		return toPublicUser(user);
	});
