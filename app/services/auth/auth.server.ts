import type { CustomSession } from '~/services/session';
import type { AppLoadContext } from '@remix-run/cloudflare';
import { eq } from 'drizzle-orm';

import { getDbFromContext, users } from '~/services/database';

const randomUsername = () => {
  const a = ['Small', 'Blue', 'Ugly'];
  const b = ['Bear', 'Dog', 'Banana'];

  const rA = Math.floor(Math.random() * a.length);
  const rB = Math.floor(Math.random() * b.length);

  const name = a[rA] + b[rB];

  return name;
};

export const getUserFromSession = async (
  session: CustomSession,
  context: AppLoadContext
) => {
  return {
    getUser: async () => {
      // TODO: Add something here to get user information
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
