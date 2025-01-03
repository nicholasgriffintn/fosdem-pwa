import { createAPIFileRoute } from '@tanstack/start/api'
import { eq } from 'drizzle-orm'

import { db } from '~/server/db'
import { user as userSchema } from '~/server/db/schema'
import { getFullAuthSession } from '~/server/auth'

export const APIRoute = createAPIFileRoute('/api/user/bookmarks/visibility')({
  POST: async ({ request }) => {
    const { visibility } = await request.json()

    if (!['private', 'public'].includes(visibility)) {
      return Response.json({ error: 'Invalid value' }, { status: 400 })
    }

    const { user } = await getFullAuthSession()

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await db
      .update(userSchema)
      .set({
        bookmarks_visibility: visibility,
      })
      .where(eq(userSchema.id, user.id))

    return Response.json({
      success: true,
    })
  },
})
