import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";

import { createQueryClientWrapper } from "../../utils/queryClient";
import { useUserSettings } from "~/hooks/use-user-settings";

vi.mock("@tanstack/react-start", () => ({
	useServerFn: (fn: unknown) => fn,
}));

const settingsMocks = vi.hoisted(() => ({
	changeBookmarksVisibility: vi.fn(),
}));

vi.mock("~/server/functions/settings", () => settingsMocks);

import { changeBookmarksVisibility } from "~/server/functions/settings";

const changeBookmarksVisibilityMock = vi.mocked(changeBookmarksVisibility);

describe("useUserSettings", () => {
	beforeEach(() => {
		changeBookmarksVisibilityMock.mockReset();
		changeBookmarksVisibilityMock.mockResolvedValue({ success: true, data: true });
	});

	it("updates bookmarks visibility on the server", async () => {
		const { wrapper, queryClient } = createQueryClientWrapper();
		const { result } = renderHook(
			() => useUserSettings({ userId: "user-1" }),
			{ wrapper },
		);

		await act(async () => {
			result.current.setBookmarksVisibility({ visibility: "public" });
		});

		expect(changeBookmarksVisibilityMock).toHaveBeenCalledWith({
			data: { visibility: "public" },
		});
		queryClient.clear();
	});
});
