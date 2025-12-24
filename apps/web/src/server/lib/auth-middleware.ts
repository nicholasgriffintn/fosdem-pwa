import { getFullAuthSession } from "~/server/auth";
import type { User } from "~/server/db/schema";

export async function withAuth<TInput, TResult>(
  ctx: { data: TInput },
  handler: (data: TInput, user: User) => Promise<TResult>,
): Promise<TResult | null> {
  const { user } = await getFullAuthSession();
  if (!user) {
    return null;
  }
  return handler(ctx.data, user);
}

export async function requireAuth(): Promise<User> {
  const { user } = await getFullAuthSession();
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}

export async function getAuthUser(): Promise<User | null> {
  const { user } = await getFullAuthSession();
  return user ?? null;
}
