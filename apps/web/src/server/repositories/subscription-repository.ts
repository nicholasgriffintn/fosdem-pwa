import { and, eq } from "drizzle-orm";

import { db } from "~/server/db";
import { subscription as subscriptionTable, type Subscription } from "~/server/db/schema";

export async function findSubscriptionsByUser(userId: number): Promise<Subscription[]> {
  return db
    .select()
    .from(subscriptionTable)
    .where(eq(subscriptionTable.user_id, userId));
}

export async function findSubscriptionByEndpoint(
  userId: number,
  endpoint: string,
): Promise<Subscription | undefined> {
  return db.query.subscription.findFirst({
    where: and(
      eq(subscriptionTable.user_id, userId),
      eq(subscriptionTable.endpoint, endpoint),
    ),
  });
}

export async function createSubscription(
  userId: number,
  endpoint: string,
  auth: string,
  p256dh: string,
): Promise<number> {
  const [subscription] = await db
    .insert(subscriptionTable)
    .values({
      user_id: userId,
      endpoint,
      auth,
      p256dh,
    })
    .returning({ id: subscriptionTable.id });

  return subscription.id;
}

export async function deleteSubscription(id: number, userId: number): Promise<void> {
  await db
    .delete(subscriptionTable)
    .where(
      and(eq(subscriptionTable.id, id), eq(subscriptionTable.user_id, userId)),
    );
}
