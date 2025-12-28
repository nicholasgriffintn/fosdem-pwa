import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";

import { getAuthSession } from "~/server/auth";

export const getSession = createServerFn({
	method: "GET",
}).handler(async () => {
	setResponseHeader("Cache-Control", "no-store, must-revalidate");
	setResponseHeader("Pragma", "no-cache");
	setResponseHeader("Expires", "0");

	try {
		const { user } = await getAuthSession();

		if (!user) {
			return null;
		}

		return user;
	} catch (error) {
		return null;
	}
});
