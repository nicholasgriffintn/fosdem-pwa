import { render, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";

import { ServiceWorkerUpdater } from "~/components/shared/ServiceWorkerUpdater";

const toastMock = vi.fn();

vi.mock("~/hooks/use-toast", () => ({
	toast: (...args: unknown[]) => toastMock(...args),
}));

const originalBroadcastChannel = window.BroadcastChannel;
const originalNavigator = window.navigator;

describe("ServiceWorkerUpdater", () => {
	beforeEach(() => {
		toastMock.mockReset();
		class MockBroadcastChannel {
			close() { }
			onmessage: ((event: MessageEvent) => void) | null = null;
			constructor(public name: string) { }
		}
		Object.defineProperty(window, "BroadcastChannel", {
			value: MockBroadcastChannel,
			configurable: true,
		});
		Object.defineProperty(window, "navigator", {
			value: {
				serviceWorker: {
					controller: { postMessage: vi.fn() },
				},
			},
			configurable: true,
		});
	});

	it("shows an update toast when the service worker signals an update", () => {
		render(<ServiceWorkerUpdater />);

		fireEvent(window, new Event("swUpdated"));

		expect(toastMock).toHaveBeenCalledWith(
			expect.objectContaining({
				title: "Update Available",
			}),
		);
	});

	afterEach(() => {
		Object.defineProperty(window, "BroadcastChannel", {
			value: originalBroadcastChannel,
			configurable: true,
		});
		Object.defineProperty(window, "navigator", {
			value: originalNavigator,
			configurable: true,
		});
	});
});
