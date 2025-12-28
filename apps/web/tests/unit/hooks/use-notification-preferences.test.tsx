import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";

import { createQueryClientWrapper } from "../../utils/queryClient";
import { useNotificationPreferences } from "~/hooks/use-notification-preferences";

vi.mock("@tanstack/react-start", () => ({
	useServerFn: (fn: unknown) => fn,
}));

const notificationPreferencesMocks = vi.hoisted(() => ({
	getNotificationPreferences: vi.fn(),
	updateNotificationPreferences: vi.fn(),
}));

vi.mock("~/server/functions/notification-preferences", () => notificationPreferencesMocks);

const getNotificationPreferencesMock = vi.mocked(
	notificationPreferencesMocks.getNotificationPreferences,
);
const updateNotificationPreferencesMock = vi.mocked(
	notificationPreferencesMocks.updateNotificationPreferences,
);

const mockPreferences = {
	id: "pref-1",
	user_id: 1,
	reminder_minutes_before: 15,
	event_reminders: true,
	schedule_changes: true,
	room_status_alerts: true,
	recording_available: true,
	daily_summary: false,
	notify_low_priority: false,
	created_at: new Date().toISOString(),
	updated_at: null,
};

describe("useNotificationPreferences", () => {
	beforeEach(() => {
		getNotificationPreferencesMock.mockReset();
		updateNotificationPreferencesMock.mockReset();
	});

	it("fetches notification preferences", async () => {
		getNotificationPreferencesMock.mockResolvedValue(mockPreferences);

		const { wrapper, queryClient } = createQueryClientWrapper();
		const { result } = renderHook(() => useNotificationPreferences(), {
			wrapper,
		});

		expect(result.current.loading).toBe(true);

		await waitFor(() => {
			expect(result.current.loading).toBe(false);
		});

		expect(result.current.preferences).toEqual(mockPreferences);
		expect(getNotificationPreferencesMock).toHaveBeenCalled();
		queryClient.clear();
	});

	it("returns null preferences when fetch fails", async () => {
		getNotificationPreferencesMock.mockResolvedValue(null);

		const { wrapper, queryClient } = createQueryClientWrapper();
		const { result } = renderHook(() => useNotificationPreferences(), {
			wrapper,
		});

		await waitFor(() => {
			expect(result.current.loading).toBe(false);
		});

		expect(result.current.preferences).toBeNull();
		queryClient.clear();
	});

	it("updates preferences", async () => {
		getNotificationPreferencesMock.mockResolvedValue(mockPreferences);
		const updatedPreferences = { ...mockPreferences, event_reminders: false };
		updateNotificationPreferencesMock.mockResolvedValue({
			data: updatedPreferences,
		});

		const { wrapper, queryClient } = createQueryClientWrapper();
		const { result } = renderHook(() => useNotificationPreferences(), {
			wrapper,
		});

		await waitFor(() => {
			expect(result.current.loading).toBe(false);
		});

		await result.current.update({ event_reminders: false });

		expect(updateNotificationPreferencesMock).toHaveBeenCalledWith({
			data: { event_reminders: false },
		});
		queryClient.clear();
	});
});
