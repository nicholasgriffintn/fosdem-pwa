import { createAPIFileRoute } from '@tanstack/start/api'

import { getFullAuthSession } from '~/server/auth'

export const APIRoute = createAPIFileRoute('/api/user/me')({
  GET: async () => {
    const { user } = await getFullAuthSession()
    return Response.json({ user })
  },
})
