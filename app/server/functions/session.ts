import { createServerFn } from "@tanstack/start";

import { getAuthSession } from "~/server/auth";

export const getSession = createServerFn({
  method: "GET",
})
  .handler(async () => {
    try {
      const { user } = await getAuthSession();
      return user;
    } catch (error) {
      return null;
    }
  });

