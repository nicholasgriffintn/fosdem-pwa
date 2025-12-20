import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createQueryClientWrapper } from "../../utils/queryClient";
import { useAuth } from "~/hooks/use-auth";
import { getSession } from "~/server/functions/session";
import { checkAndSyncOnOnline } from "~/lib/backgroundSync";
import { enableSync } from "~/lib/localStorage";

vi.mock("@tanstack/react-router", () => ({
	useNavigate: vi.fn(() => vi.fn()),
}));

vi.mock("@tanstack/react-start", () => ({
	useServerFn: (fn: unknown) => fn,
}));

const sessionMocks = vi.hoisted(() => ({
	getSession: vi.fn(),
}));

vi.mock("~/server/functions/session", () => sessionMocks);

const backgroundSyncMocks = vi.hoisted(() => ({
	checkAndSyncOnOnline: vi.fn(() => Promise.resolve()),
}));

vi.mock("~/lib/backgroundSync", () => backgroundSyncMocks);

vi.mock("~/lib/localStorage", () => ({
	enableSync: vi.fn(),
}));

const getSessionMock = vi.mocked(getSession);
const checkAndSyncOnOnlineMock = vi.mocked(checkAndSyncOnOnline);
const enableSyncMock = vi.mocked(enableSync);

const fetchMock = vi.fn();

describe("useAuth", () => {
	beforeEach(() => {
		getSessionMock.mockReset();
		checkAndSyncOnOnlineMock.mockReset();
		checkAndSyncOnOnlineMock.mockResolvedValue(undefined);
		enableSyncMock.mockReset();
		global.fetch = fetchMock as any;
		fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });
	});

	it("fetches session data", async () => {
		getSessionMock.mockResolvedValue({ id: "user-1", name: "Test" } as any);

		const { wrapper, queryClient } = createQueryClientWrapper();
		const { result } = renderHook(() => useAuth(), { wrapper });

		await waitFor(() => {
			expect(result.current.user?.id).toBe("user-1");
		});
		queryClient.clear();
	});

	it("logs out users via the logout mutation", async () => {
		getSessionMock.mockResolvedValue({ id: "user-1" } as any);

		const { wrapper, queryClient } = createQueryClientWrapper();
		const { result } = renderHook(() => useAuth(), { wrapper });

		await waitFor(() => {
			expect(result.current.user?.id).toBe("user-1");
		});

		await act(async () => {
			await result.current.logout();
		});

		expect(fetchMock).toHaveBeenCalledWith("/api/auth/logout", {
			method: "POST",
		});
		queryClient.clear();
	});

	it("enables sync once a user is available", async () => {
		getSessionMock.mockResolvedValue({ id: "user-1" } as any);

		const { wrapper, queryClient } = createQueryClientWrapper();
		renderHook(() => useAuth(), { wrapper });

		await waitFor(() => {
			expect(enableSyncMock).toHaveBeenCalled();
		});
		expect(checkAndSyncOnOnlineMock).toHaveBeenCalledWith("user-1");
		queryClient.clear();
	});
});
