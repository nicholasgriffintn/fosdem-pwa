import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FavouriteButton } from "~/components/shared/FavouriteButton";

const routerMocks = vi.hoisted(() => ({
	useRouterState: ({
		select,
	}: {
		select: (state: { location: { pathname: string; search: string } }) => string;
	}) => select({ location: { pathname: "/test", search: "" } }),
}));

vi.mock("@tanstack/react-router", () => routerMocks);

vi.mock("~/hooks/use-toast", () => ({
	toast: vi.fn(),
}));

import { toast } from "~/hooks/use-toast";

describe("FavouriteButton", () => {
	it("calls onCreateBookmark with correct parameters when clicked", async () => {
		const onCreateBookmark = vi.fn().mockResolvedValue(undefined);
		const user = userEvent.setup();

		render(
			<FavouriteButton
				year={2024}
				type="event"
				slug="test-event"
				status="unfavourited"
				onCreateBookmark={onCreateBookmark}
			/>,
		);

		const button = screen.getByRole("button");
		await user.click(button);

		expect(onCreateBookmark).toHaveBeenCalledWith({
			year: 2024,
			type: "event",
			slug: "test-event",
			status: "favourited",
		});
	});

	it("toggles between favourited and unfavourited states", async () => {
		const onCreateBookmark = vi.fn().mockResolvedValue(undefined);
		const user = userEvent.setup();

		const { rerender } = render(
			<FavouriteButton
				year={2024}
				type="event"
				slug="test-event"
				status="unfavourited"
				onCreateBookmark={onCreateBookmark}
			/>,
		);

		const button = screen.getByRole("button");
		await user.click(button);

		expect(onCreateBookmark).toHaveBeenCalledWith({
			year: 2024,
			type: "event",
			slug: "test-event",
			status: "favourited",
		});

		rerender(
			<FavouriteButton
				year={2024}
				type="event"
				slug="test-event"
				status="favourited"
				onCreateBookmark={onCreateBookmark}
			/>,
		);

		await user.click(button);

		expect(onCreateBookmark).toHaveBeenLastCalledWith({
			year: 2024,
			type: "event",
			slug: "test-event",
			status: "unfavourited",
		});
	});

	it("keeps optimistic state until parent status changes", async () => {
		const onCreateBookmark = vi.fn().mockResolvedValue(undefined);
		const user = userEvent.setup();

		render(
			<FavouriteButton
				year={2024}
				type="event"
				slug="test-event"
				status="favourited"
				onCreateBookmark={onCreateBookmark}
			/>,
		);

		const button = screen.getByRole("button");
		await user.click(button);

		await waitFor(() => {
			expect(button).not.toBeDisabled();
		});

		const starIcon = button.querySelector("svg");
		expect(starIcon).not.toBeNull();
		expect(starIcon?.classList.contains("icon--filled")).toBe(false);
	});

	it("rolls back optimistic update on error", async () => {
		const onCreateBookmark = vi
			.fn()
			.mockRejectedValue(new Error("Network error"));
		const user = userEvent.setup();
		const toastSpy = vi.mocked(toast);

		render(
			<FavouriteButton
				year={2024}
				type="event"
				slug="test-event"
				status="unfavourited"
				onCreateBookmark={onCreateBookmark}
			/>,
		);

		const button = screen.getByRole("button");

		await user.click(button);

		await waitFor(() => {
			expect(toastSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					title: "Error",
					description: "Failed to update bookmark. Please try again.",
					variant: "destructive",
				}),
			);
		});

		expect(button).not.toBeDisabled();
	});

	it("shows loading state during async operation", async () => {
		let resolveBookmark: () => void;
		const bookmarkPromise = new Promise<void>((resolve) => {
			resolveBookmark = resolve;
		});
		const onCreateBookmark = vi.fn().mockReturnValue(bookmarkPromise);
		const user = userEvent.setup();

		render(
			<FavouriteButton
				year={2024}
				type="event"
				slug="test-event"
				status="unfavourited"
				onCreateBookmark={onCreateBookmark}
			/>,
		);

		const button = screen.getByRole("button");
		await user.click(button);

		expect(button).toBeDisabled();

		resolveBookmark!();

		await waitFor(() => {
			expect(button).not.toBeDisabled();
		});
	});

	it("prevents double-click while processing", async () => {
		let resolveBookmark: () => void;
		const bookmarkPromise = new Promise<void>((resolve) => {
			resolveBookmark = resolve;
		});
		const onCreateBookmark = vi.fn().mockReturnValue(bookmarkPromise);
		const user = userEvent.setup();

		render(
			<FavouriteButton
				year={2024}
				type="event"
				slug="test-event"
				status="unfavourited"
				onCreateBookmark={onCreateBookmark}
			/>,
		);

		const button = screen.getByRole("button");
		await user.click(button);
		await user.click(button);

		expect(onCreateBookmark).toHaveBeenCalledTimes(1);

		resolveBookmark!();

		await waitFor(() => {
			expect(button).not.toBeDisabled();
		});
	});

	it("shows success toast on successful bookmark creation", async () => {
		const onCreateBookmark = vi.fn().mockResolvedValue(undefined);
		const user = userEvent.setup();
		const toastSpy = vi.mocked(toast);

		render(
			<FavouriteButton
				year={2024}
				type="event"
				slug="test-event"
				status="unfavourited"
				onCreateBookmark={onCreateBookmark}
			/>,
		);

		const button = screen.getByRole("button");
		await user.click(button);

		await waitFor(() => {
			expect(toastSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					title: "Favourited",
					description: "You can undo this action by clicking the button again",
				}),
			);
		});
	});
});
