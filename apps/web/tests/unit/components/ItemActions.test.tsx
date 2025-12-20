import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ItemActions } from "~/components/ItemActions";
import type { Event } from "~/types/fosdem";

const routerMocks = vi.hoisted(() => ({
	Link: ({ children, ...props }: { children: ReactNode }) => (
		<a {...props}>{children}</a>
	),
}));

const toastMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-router", () => routerMocks);
vi.mock("~/hooks/use-toast", () => ({
	toast: toastMock,
}));

const createEvent = (overrides?: Partial<Event>): Event => ({
	id: "event-1",
	title: "Intro to FOSDEM",
	subtitle: "",
	description: "Welcome session",
	room: "H.1302",
	persons: [],
	startTime: "09:00",
	duration: "01:00",
	abstract: "",
	chat: "",
	links: [],
	attachments: [],
	streams: [],
	day: "day1",
	trackKey: "main",
	isLive: false,
	status: "scheduled",
	type: "talk",
	url: "https://fosdem.org/event-1",
	feedbackUrl: "",
	language: "en",
	isFavourited: false,
	...overrides,
});

describe("ItemActions", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("invokes bookmark callback when favouriting an item", async () => {
		const user = userEvent.setup();
		const onCreateBookmark = vi.fn().mockResolvedValue(undefined);

		render(
			<ItemActions
				item={createEvent()}
				year={2024}
				type="event"
				bookmarksLoading={false}
				onCreateBookmark={onCreateBookmark}
			/>,
		);

		const [favouriteButton] = screen.getAllByRole("button");
		await user.click(favouriteButton);

		await waitFor(() => {
			expect(onCreateBookmark).toHaveBeenCalledWith({
				year: 2024,
				type: "event",
				slug: "event-1",
				status: "favourited",
			});
		});

		expect(toastMock).toHaveBeenCalledWith(
			expect.objectContaining({ title: "Favourited" }),
		);
	});

	it("allows removing a bookmark when the item is already favourited", async () => {
		const user = userEvent.setup();
		const onCreateBookmark = vi.fn().mockResolvedValue(undefined);

		render(
			<ItemActions
				item={createEvent({ isFavourited: true })}
				year={2024}
				type="event"
				bookmarksLoading={false}
				onCreateBookmark={onCreateBookmark}
			/>,
		);

		const [favouriteButton] = screen.getAllByRole("button");
		await user.click(favouriteButton);

		await waitFor(() => {
			expect(onCreateBookmark).toHaveBeenCalledWith({
				year: 2024,
				type: "event",
				slug: "event-1",
				status: "unfavourited",
			});
		});

		expect(toastMock).toHaveBeenCalledWith(
			expect.objectContaining({ title: "Unfavourited" }),
		);
	});
});
