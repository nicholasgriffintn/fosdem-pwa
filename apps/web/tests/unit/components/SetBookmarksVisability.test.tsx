import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SetBookmarksVisability } from "~/components/Profile/SetBookmarksVisability";

const userSettingsModule = vi.hoisted(() => ({
	useUserSettings: vi.fn(),
}));

vi.mock("~/hooks/use-user-settings", () => userSettingsModule);

const useUserSettingsMock = vi.mocked(userSettingsModule.useUserSettings);

describe("SetBookmarksVisability", () => {
	it("toggles bookmarks visibility", () => {
		const setBookmarksVisibility = vi.fn();
		useUserSettingsMock.mockReturnValue({ setBookmarksVisibility });

		render(
			<SetBookmarksVisability userId="user-1" bookmarksVisibility="private" />,
		);

		const toggle = screen.getByRole("switch");
		fireEvent.click(toggle);

		expect(setBookmarksVisibility).toHaveBeenCalledWith({
			visibility: "public",
		});
	});
});
