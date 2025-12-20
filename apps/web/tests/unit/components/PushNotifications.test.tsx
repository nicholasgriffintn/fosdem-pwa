import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PushNotifications } from "~/components/PushNotifications";

const subscriptionsModule = vi.hoisted(() => ({
	useSubscriptions: vi.fn(),
}));
const mutateSubscriptionsModule = vi.hoisted(() => ({
	useMutateSubscriptions: vi.fn(),
}));

vi.mock("~/hooks/use-subscriptions", () => subscriptionsModule);

vi.mock("~/hooks/use-mutate-subscriptions", () => mutateSubscriptionsModule);

const useSubscriptionsMock = vi.mocked(subscriptionsModule.useSubscriptions);
const useMutateSubscriptionsMock = vi.mocked(
	mutateSubscriptionsModule.useMutateSubscriptions,
);

const toastMock = vi.fn();

const originalNotification = window.Notification;
const originalPushManager = (window as any).PushManager;
const originalServiceWorker = navigator.serviceWorker;
const originalNavigator = window.navigator;

vi.mock("~/hooks/use-toast", () => ({
	toast: (...args: unknown[]) => toastMock(...args),
}));

describe("PushNotifications", () => {
	beforeEach(() => {
		useSubscriptionsMock.mockReset();
		useMutateSubscriptionsMock.mockReset();
		toastMock.mockReset();
		useSubscriptionsMock.mockReturnValue({ subscriptions: [], loading: false });
		useMutateSubscriptionsMock.mockReturnValue({
			create: vi.fn(),
			delete: vi.fn(),
			createLoading: false,
			deleteLoading: false,
		});
	});

	afterEach(() => {
		Object.defineProperty(window, "Notification", {
			value: originalNotification,
			configurable: true,
		});
		Object.defineProperty(window, "PushManager", {
			value: originalPushManager,
			configurable: true,
		});
		Object.defineProperty(navigator, "serviceWorker", {
			value: originalServiceWorker,
			configurable: true,
		});
		Object.defineProperty(window, "navigator", {
			value: originalNavigator,
			configurable: true,
		});
	});

	it("displays unsupported message when browser capabilities are missing", () => {
		render(<PushNotifications />);
		expect(
			screen.getByText(/does not support push notifications/i),
		).toBeInTheDocument();
	});

	it("subscribes and unsubscribes devices when supported", async () => {
		const requestPermission = vi.fn().mockResolvedValue("granted");
		const subscribe = vi.fn().mockResolvedValue({
			toJSON: () => ({
				endpoint: "endpoint",
				keys: {
					auth: "auth",
					p256dh: "p256dh",
				},
			}),
		});
		const getSubscription = vi.fn().mockResolvedValue(null);

		Object.defineProperty(window, "Notification", {
			value: { permission: "default", requestPermission },
			configurable: true,
		});
		Object.defineProperty(window, "PushManager", {
			value: function PushManager() {},
			configurable: true,
		});

		Object.defineProperty(navigator, "serviceWorker", {
			value: {
				ready: Promise.resolve({
					pushManager: {
						subscribe,
						getSubscription,
					},
				}),
			},
			configurable: true,
		});

		useSubscriptionsMock.mockReturnValue({
			subscriptions: [{ id: 1, endpoint: "endpoint", created_at: new Date().toISOString() }],
			loading: false,
		});

		const createMock = vi.fn();
		const deleteMock = vi.fn();
		useMutateSubscriptionsMock.mockReturnValue({
			create: createMock,
			delete: deleteMock,
			createLoading: false,
			deleteLoading: false,
		});

		render(<PushNotifications />);

		const subscribeButton = await screen.findAllByText("Subscribe");
		fireEvent.click(subscribeButton[0]!);

		await waitFor(() => {
			expect(createMock).toHaveBeenCalledWith({
				endpoint: "endpoint",
				auth: "auth",
				p256dh: "p256dh",
			});
		});

		const unsubscribeButton = await screen.findByText("Unsubscribe");
		fireEvent.click(unsubscribeButton);

		expect(deleteMock).toHaveBeenCalledWith({ id: 1 });
	});
});
