import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";

import { db } from "~/server/db";
import { subscription as subscriptionTable } from "~/server/db/schema";
import { getFullAuthSession } from "~/server/auth";

export const createSubscription = createServerFn({
	method: "POST",
})
	.inputValidator((data: { endpoint: string; auth: string; p256dh: string }) => data)
	.handler(async (ctx: any) => {
		const { endpoint, auth, p256dh } = ctx.data;

		const { user } = await getFullAuthSession();

		if (!user) {
			return null;
		}

		try {
			const subscription = await db
				.insert(subscriptionTable)
				.values({
					user_id: user.id,
					endpoint,
					auth,
					p256dh,
				})
				.returning({ id: subscriptionTable.id });

			return {
				success: true,
				id: subscription[0].id,
			};
		} catch (error) {
			console.error(error);

			return {
				success: false,
				error: "Failed to save subscription",
			};
		}
	});

export const deleteSubscription = createServerFn({
	method: "POST",
})
	.inputValidator((data: { id: number }) => data)
	.handler(async (ctx: any) => {
		const { id } = ctx.data;

		const { user } = await getFullAuthSession();

		if (!user) {
			return null;
		}

		try {
			await db
				.delete(subscriptionTable)
				.where(
					and(
						eq(subscriptionTable.id, id),
						eq(subscriptionTable.user_id, user.id),
					),
				);

			return {
				success: true,
			};
		} catch (error) {
			console.error(error);

			return {
				success: false,
				error: "Failed to delete subscription",
			};
		}
	});

export const getSubscriptions = createServerFn({
	method: "GET",
}).handler(async () => {
	const { user } = await getFullAuthSession();

	if (!user) {
		return null;
	}

	try {
		const subscriptions = await db
			.select()
			.from(subscriptionTable)
			.where(eq(subscriptionTable.user_id, user.id));

		return subscriptions;
	} catch (error) {
		console.error(error);

		return [];
	}
});
