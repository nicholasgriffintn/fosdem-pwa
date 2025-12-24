import { createServerFn } from "@tanstack/react-start";

import { getAuthUser } from "~/server/lib/auth-middleware";
import { ok, err, type Result } from "~/server/lib/result";
import {
	findSubscriptionsByUser,
	findSubscriptionByEndpoint,
	createSubscription as createSubscriptionRepo,
	deleteSubscription as deleteSubscriptionRepo,
} from "~/server/repositories/subscription-repository";
import type { Subscription } from "~/server/db/schema";

export const createSubscription = createServerFn({
	method: "POST",
})
	.inputValidator(
		(data: { endpoint: string; auth: string; p256dh: string }) => data,
	)
	.handler(async (ctx): Promise<Result<number> | null> => {
		const { endpoint, auth, p256dh } = ctx.data;

		const user = await getAuthUser();
		if (!user) {
			return null;
		}

		try {
			const existingSubscription = await findSubscriptionByEndpoint(user.id, endpoint);
			if (existingSubscription) {
				return ok(existingSubscription.id);
			}

			const id = await createSubscriptionRepo(user.id, endpoint, auth, p256dh);
			return ok(id);
		} catch (error) {
			console.error(error);
			return err("Failed to save subscription");
		}
	});

export const deleteSubscription = createServerFn({
	method: "POST",
})
	.inputValidator((data: { id: number }) => data)
	.handler(async (ctx): Promise<Result<boolean> | null> => {
		const { id } = ctx.data;

		const user = await getAuthUser();
		if (!user) {
			return null;
		}

		try {
			await deleteSubscriptionRepo(id, user.id);
			return ok(true);
		} catch (error) {
			console.error(error);
			return err("Failed to delete subscription");
		}
	});

export const getSubscriptions = createServerFn({
	method: "GET",
}).handler(async (): Promise<Subscription[] | null> => {
	const user = await getAuthUser();
	if (!user) {
		return null;
	}

	try {
		return findSubscriptionsByUser(user.id);
	} catch (error) {
		console.error(error);
		return [];
	}
});
