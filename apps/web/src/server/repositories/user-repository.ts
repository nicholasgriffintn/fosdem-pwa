import { eq, or, sql, and } from "drizzle-orm";

import { db } from "~/server/db";
import {
  user as userTable,
  session as sessionTable,
  type User,
} from "~/server/db/schema";
import { createStandardDate } from "~/lib/dateTime";
import { CacheManager } from "~/server/cache";
import { CacheKeys } from "~/server/lib/cache-keys";

const cache = CacheManager.getInstance();

export function normalizeUserId(userId: string): string {
  return userId.trim().replace(/^@/, "").toLowerCase();
}

export async function findUserByUsername(userId: string): Promise<User | undefined> {
  const normalized = normalizeUserId(userId);

  const conditions = [
    eq(sql`lower(${userTable.github_username})`, normalized),
    eq(sql`lower(${userTable.gitlab_username})`, normalized),
    eq(sql`lower(${userTable.discord_username})`, normalized),
    eq(sql`lower(${userTable.mastodon_username})`, normalized),
    eq(sql`lower(${userTable.mastodon_acct})`, normalized),
  ];

  return db.query.user.findFirst({
    where: or(...conditions),
  });
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  return db.query.user.findFirst({
    where: eq(userTable.email, email),
  });
}

export async function findUserById(id: number): Promise<User | undefined> {
  return db.query.user.findFirst({
    where: eq(userTable.id, id),
  });
}

export async function updateUser(
  userId: number,
  data: Partial<Omit<User, "id" | "created_at">>,
): Promise<User | undefined> {
  const [updated] = await db
    .update(userTable)
    .set({
      ...data,
      updated_at: createStandardDate(new Date()).toISOString(),
    })
    .where(eq(userTable.id, userId))
    .returning();

  if (updated) {
    const sessions = await db
      .select({ id: sessionTable.id })
      .from(sessionTable)
      .where(eq(sessionTable.user_id, userId));

    await Promise.all(
      sessions.map((session) => cache.invalidate(CacheKeys.session(session.id))),
    );
  }

  return updated;
}

export async function upgradeGuestUser(
  userId: number,
  data: Partial<Omit<User, "id" | "created_at">>,
): Promise<User | undefined> {
  const [updated] = await db
    .update(userTable)
    .set({
      ...data,
      is_guest: false,
      updated_at: createStandardDate(new Date()).toISOString(),
    })
    .where(and(eq(userTable.id, userId), eq(userTable.is_guest, true)))
    .returning();

  if (updated) {
    const sessions = await db
      .select({ id: sessionTable.id })
      .from(sessionTable)
      .where(eq(sessionTable.user_id, userId));

    await Promise.all(
      sessions.map((session) => cache.invalidate(CacheKeys.session(session.id))),
    );
  }

  return updated;
}

export async function createUser(
  data: Omit<User, "id" | "created_at" | "updated_at">,
): Promise<User> {
  const now = createStandardDate(new Date()).toISOString();
  const [user] = await db
    .insert(userTable)
    .values({
      ...data,
      created_at: now,
      updated_at: now,
    })
    .returning();

  return user;
}
