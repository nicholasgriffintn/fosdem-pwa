import { createServerFn } from "@tanstack/react-start";

import { getAuthUser } from "~/server/lib/auth-middleware";
import { ok, err, type Result } from "~/server/lib/result";
import { updateUser } from "~/server/repositories/user-repository";

export const changeBookmarksVisibility = createServerFn({
	method: "POST",
})
	.inputValidator((data: { visibility: string }) => {
		if (!["private", "public"].includes(data.visibility)) {
			throw new Error("Invalid value");
		}

		return data;
	})
	.handler(async (ctx): Promise<Result<boolean> | null> => {
		const user = await getAuthUser();
		if (!user) {
			return null;
		}

		try {
			await updateUser(user.id, {
				bookmarks_visibility: ctx.data.visibility,
			});
			return ok(true);
		} catch (error) {
			console.error(error);
			return err("Failed to update visibility");
		}
	});
