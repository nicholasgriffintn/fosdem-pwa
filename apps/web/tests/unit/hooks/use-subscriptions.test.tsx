import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createQueryClientWrapper } from "../../utils/queryClient";
import { useSubscriptions } from "~/hooks/use-subscriptions";
import { useMutateSubscriptions } from "~/hooks/use-mutate-subscriptions";

vi.mock("@tanstack/react-start", () => ({
	useServerFn: (fn: unknown) => fn,
}));

const subscriptionMocks = vi.hoisted(() => ({
	getSubscriptions: vi.fn(),
	createSubscription: vi.fn(),
	deleteSubscription: vi.fn(),
}));

vi.mock("~/server/functions/subscriptions", () => subscriptionMocks);

import {
	getSubscriptions,
	createSubscription,
	deleteSubscription,
} from "~/server/functions/subscriptions";

const getSubscriptionsMock = vi.mocked(getSubscriptions);
const createSubscriptionMock = vi.mocked(createSubscription);
const deleteSubscriptionMock = vi.mocked(deleteSubscription);

describe("subscriptions hooks", () => {
	beforeEach(() => {
		getSubscriptionsMock.mockReset();
		createSubscriptionMock.mockReset();
		deleteSubscriptionMock.mockReset();
		getSubscriptionsMock.mockResolvedValue([
			{
				id: 1,
				endpoint: "test",
				user_id: 1,
				auth: "auth",
				p256dh: "p256dh",
				created_at: new Date().toISOString(),
				updated_at: null,
			},
		]);
		createSubscriptionMock.mockResolvedValue({ success: true, id: 1 });
		deleteSubscriptionMock.mockResolvedValue({ success: true });
	});

	it("fetches subscriptions via useSubscriptions", async () => {
		const { wrapper, queryClient } = createQueryClientWrapper();
		const { result } = renderHook(() => useSubscriptions(), { wrapper });

		await waitFor(() => {
			expect(result.current.subscriptions).toHaveLength(1);
		});
		queryClient.clear();
	});

	it("creates and deletes subscriptions", async () => {
		const { wrapper, queryClient } = createQueryClientWrapper();
		const { result } = renderHook(() => useMutateSubscriptions(), { wrapper });

		await act(async () => {
			result.current.create({
				endpoint: "endpoint",
				auth: "auth-key",
				p256dh: "p256dh-key",
			});
		});

		expect(createSubscriptionMock).toHaveBeenCalledWith({
			data: {
				endpoint: "endpoint",
				auth: "auth-key",
				p256dh: "p256dh-key",
			},
		});

		await act(async () => {
			result.current.delete({ id: 1 });
		});
		expect(deleteSubscriptionMock).toHaveBeenCalledWith({ data: { id: 1 } });
		queryClient.clear();
	});
});
