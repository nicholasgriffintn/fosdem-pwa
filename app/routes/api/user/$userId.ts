import { createAPIFileRoute } from '@tanstack/start/api'
import { eq } from "drizzle-orm";

import { db } from "~/server/db";
import {
  user as userTable,
} from "~/server/db/schema";

export const APIRoute = createAPIFileRoute('/api/user/$userId')({
  GET: async ({ params }) => {
    const userId = params.userId

    if (!userId) {
      return Response.json({ error: 'User ID is required' }, { status: 400 })
    }

    const user = await db.query.user.findFirst({
      where: eq(userTable.github_username, userId),
    })
    return Response.json({ user })
  },
})
