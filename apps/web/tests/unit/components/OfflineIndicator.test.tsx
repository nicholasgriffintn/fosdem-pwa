import { act, render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";

import { OfflineIndicator } from "~/components/OfflineIndicator";

const onlineStatusModule = vi.hoisted(() => ({
	useOnlineStatus: vi.fn(),
}));

vi.mock("~/hooks/use-online-status", () => onlineStatusModule);

vi.mock("~/hooks/use-auth", () => ({
	useAuth: vi.fn(() => ({ user: { id: "user-1" } })),
}));

const localStorageMocks = vi.hoisted(() => ({
	getSyncQueue: vi.fn(),
}));

vi.mock("~/lib/localStorage", () => localStorageMocks);

vi.mock("~/lib/backgroundSync", () => ({
	checkAndSyncOnOnline: vi.fn(),
	registerBackgroundSync: vi.fn(),
}));

import { getSyncQueue } from "~/lib/localStorage";
import { registerBackgroundSync } from "~/lib/backgroundSync";

const useOnlineStatusMock = vi.mocked(onlineStatusModule.useOnlineStatus);
const getSyncQueueMock = vi.mocked(getSyncQueue);
const registerBackgroundSyncMock = vi.mocked(registerBackgroundSync);

const originalLocation = window.location;

describe("OfflineIndicator", () => {
	beforeEach(() => {
		useOnlineStatusMock.mockReturnValue(false);
		getSyncQueueMock.mockResolvedValue([]);
		registerBackgroundSyncMock.mockClear();
		Object.defineProperty(window, "location", {
			value: { href: "", reload: vi.fn() },
			configurable: true,
		});
	});

	it("shows offline messaging and allows navigation to offline page", async () => {
		render(<OfflineIndicator />);
		act(() => {
			window.dispatchEvent(new Event("offline"));
		});

		await waitFor(() => {
			expect(screen.getByText(/Offline Mode/i)).toBeInTheDocument();
		});
		expect(registerBackgroundSyncMock).toHaveBeenCalled();

		const offlineLink = screen.getByRole("button", { name: /view offline/i });
		fireEvent.click(offlineLink);
		expect(window.location.href).toBe("/offline");
	});

	afterEach(() => {
		Object.defineProperty(window, "location", {
			value: originalLocation,
			configurable: true,
		});
	});
});
