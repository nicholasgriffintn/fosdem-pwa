import type { CustomSession } from '~/types/session';
import type { AppLoadContext } from '@remix-run/cloudflare';
import { eq } from 'drizzle-orm';
import { isbot } from 'isbot';

import { getDbFromContext, users } from '~/services/database';
import { randomUsername } from '~/lib/username';

export const getUserFromSession = async (
  session: CustomSession,
  userAgent: string,
  context: AppLoadContext
) => {
  return {
    getUser: async () => {
      const isThisUserABot = isbot(userAgent);
      if (isThisUserABot || !userAgent) {
        return null;
      }

      const userValue = session.get('user');

      const db = getDbFromContext(context);

      if (!userValue?.id) {
        const newUser = await db
          .insert(users)
          .values({
            name: randomUsername(),
            type: 'guest',
          })
          .returning({
            id: users.id,
            name: users.name,
            type: users.type,
          })
          .get();

        await session.set('user', newUser);

        return newUser;
      } else {
        const user = await db
          .select({
            id: users.id,
            name: users.name,
            type: users.type,
          })
          .from(users)
          .where(eq(users.id, userValue.id))
          .get();

        if (!user) {
          return null;
        }

        return user;
      }
    },
  };
};
