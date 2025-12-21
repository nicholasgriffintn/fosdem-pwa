import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { BookmarksList } from "~/components/Bookmarks/BookmarksList";
import type { Bookmark } from "~/server/db/schema";
import type { Conference } from "~/types/fosdem";

const routerMocks = vi.hoisted(() => ({
	Link: ({ children, ...props }: { children: ReactNode }) => (
		<a {...props}>{children}</a>
	),
	useNavigate: () => () => {},
	useRouterState: ({
		select,
	}: {
		select: (state: { location: { pathname: string; search: string } }) => string;
	}) => select({ location: { pathname: "/test", search: "" } }),
}));

vi.mock("@tanstack/react-router", () => routerMocks);

vi.mock("~/hooks/use-auth", () => ({
	useAuth: () => ({ user: null, loading: false, logout: vi.fn() }),
}));

const createFosdemData = (): Conference => {
	const dayId = "day1";
	return {
		conference: {
			acronym: "FOSDEM",
			title: "FOSDEM",
			subtitle: "Free and Open Source Software Developers' European Meeting",
			venue: "ULB",
			city: "Brussels",
			start: "2024-02-03T00:00:00Z",
			end: "2024-02-04T23:59:59Z",
			days: [dayId],
			day_change: "04:00",
			timeslot_duration: "00:15",
			time_zone_name: "Europe/Brussels",
		},
		types: {
			maintrack: {
				id: "maintrack",
				name: "Main Track",
				trackCount: 1,
				eventCount: 1,
				roomCount: 1,
				buildingCount: 1,
			},
		},
		buildings: {
			building: {
				id: "K",
				roomCount: 1,
				trackCount: 1,
				eventCount: 1,
			},
		},
		rooms: {
			room: {
				name: "H.1302",
				slug: "h1302",
				buildingId: "K",
				eventCount: 1,
				trackCount: 1,
			},
		},
		days: {
			[dayId]: {
				id: dayId,
				name: "Day 1",
				date: "2024-02-03",
				start: "09:00",
				end: "18:00",
				eventCount: 1,
				trackCount: 1,
				roomCount: 1,
				buildingCount: 1,
			},
		},
		tracks: {
			track: {
				id: "track",
				name: "Main Track",
				description: "Key sessions",
				room: "H.1302",
				type: "maintrack",
				day: 1,
				eventCount: 1,
			},
		},
		events: {
			"event-1": {
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
				day: dayId,
				trackKey: "track",
				isLive: false,
				status: "scheduled",
				type: "talk",
				url: "https://fosdem.org/event-1",
				feedbackUrl: "",
				language: "en",
			},
		},
	};
};

describe("BookmarksList", () => {
	const renderWithClient = (ui: ReactNode) => {
		const queryClient = new QueryClient({
			defaultOptions: { queries: { retry: false } },
		});
		const result = render(
			<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
		);
		return { ...result, queryClient };
	};

	it("renders an empty-state when no bookmarks exist", () => {
		const { queryClient } = renderWithClient(
			<BookmarksList
				bookmarks={[]}
				fosdemData={createFosdemData()}
				year={2024}
				loading={false}
			/>,
		);

		expect(screen.getByText(/No bookmarks yet/i)).toBeInTheDocument();
		queryClient.clear();
	});

	it("renders bookmarked events and tracks", () => {
		const fosdemData = createFosdemData();
		const timestamp = new Date().toISOString();
		const bookmarks: Bookmark[] = [
			{
				id: "2024_event-1",
				year: 2024,
				slug: "event-1",
				type: "event",
				status: "favourited",
				user_id: 1,
				priority: null,
				last_notification_sent_at: null,
				created_at: timestamp,
				updated_at: timestamp,
			},
			{
				id: "2024_track",
				year: 2024,
				slug: "track",
				type: "track",
				status: "favourited",
				user_id: 1,
				priority: null,
				last_notification_sent_at: null,
				created_at: timestamp,
				updated_at: timestamp,
			},
		];

		const { queryClient } = renderWithClient(
			<BookmarksList
				bookmarks={bookmarks}
				fosdemData={fosdemData}
				year={2024}
				loading={false}
			/>,
		);

		expect(screen.getByText(/Bookmarked Events/i)).toBeInTheDocument();
		expect(screen.getByText(/Bookmarked Tracks/i)).toBeInTheDocument();
		expect(screen.getByText(/Intro to FOSDEM/i)).toBeInTheDocument();
		expect(screen.getAllByText(/1 events/i).length).toBeGreaterThan(0);
		queryClient.clear();
	});
});
