"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import {
	createSubscription,
	deleteSubscription,
} from "~/server/functions/subscriptions";
import { subscriptionQueryKeys } from "~/lib/query-keys";

export function useMutateSubscriptions() {
	const queryClient = useQueryClient();
	const createSubscriptionFromServer = useServerFn(createSubscription);
	const deleteSubscriptionFromServer = useServerFn(deleteSubscription);

	const create = useMutation({
		mutationKey: ["createSubscription"],
		mutationFn: async ({
			endpoint,
			auth,
			p256dh,
		}: {
			endpoint: string;
			auth: string;
			p256dh: string;
		}) => {
			const data = await createSubscriptionFromServer({
				data: { endpoint, auth, p256dh },
			});

			if (!data?.success) {
				throw new Error("Failed to create subscription");
			}

			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: subscriptionQueryKeys.list,
			});
		},
	});

	const handleDeleteSubscription = useMutation({
		mutationKey: ["deleteSubscription"],
		mutationFn: async ({ id }: { id: number }) => {
			const data = await deleteSubscriptionFromServer({ data: { id } });

			if (!data?.success) {
				throw new Error("Failed to delete subscription");
			}

			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: subscriptionQueryKeys.list,
			});
		},
	});

	return {
		create: create.mutate,
		createLoading: create.isPending,
		delete: handleDeleteSubscription.mutate,
		deleteLoading: handleDeleteSubscription.isPending,
	};
}
