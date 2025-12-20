import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, fireEvent } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { EventList } from "~/components/Event/EventList";
import type { Event } from "~/types/fosdem";

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => () => {},
	useRouterState: () => ({ location: { pathname: "/" } }),
	Link: ({ children, ...props }: { children: ReactNode }) => (
		<a {...props}>{children}</a>
	),
}));

vi.mock("~/hooks/use-auth", () => ({
	useAuth: () => ({ user: null, loading: false, logout: vi.fn() }),
}));

const sampleEvents: Event[] = [
	{
		id: "event-1",
		title: "Talk A",
		subtitle: "",
		description: "Description",
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
		trackKey: "Main Track",
		isLive: false,
		status: "scheduled",
		type: "talk",
		url: "https://fosdem.org/event-1",
		feedbackUrl: "",
		language: "en",
	},
	{
		id: "event-2",
		title: "Talk B",
		subtitle: "",
		description: "Description",
		room: "H.1302",
		persons: [],
		startTime: "10:00",
		duration: "01:00",
		abstract: "",
		chat: "",
		links: [],
		attachments: [],
		streams: [],
		day: "day1",
		trackKey: "Main Track",
		isLive: false,
		status: "scheduled",
		type: "talk",
		url: "https://fosdem.org/event-2",
		feedbackUrl: "",
		language: "en",
	},
];

const days = [{ id: "day1", name: "Day 1" }];

const renderWithClient = (ui: ReactNode) => {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	return {
		queryClient,
		...render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>),
	};
};

describe("EventList", () => {
	it("renders grouped tabs and switches view modes", () => {
		const { queryClient } = renderWithClient(
			<EventList
				events={sampleEvents}
				year={2024}
				groupByDay
				days={days}
				displayViewMode
				title="Schedule"
			/>,
		);

		expect(screen.getByRole("heading", { name: /Schedule/i })).toBeInTheDocument();

		const calendarButton = screen.getByRole("button", { name: /calendar/i });
		fireEvent.click(calendarButton);
		expect(screen.getByText(/Talk A/i)).toBeInTheDocument();
		expect(screen.getByText(/Talk B/i)).toBeInTheDocument();
		
		const scheduleButton = screen.getByRole("button", { name: /schedule/i });
		fireEvent.click(scheduleButton);
		expect(screen.getByText(/Talk A/i)).toBeInTheDocument();

		queryClient.clear();
	});

	it("renders empty state when no events are passed", () => {
		const { queryClient } = renderWithClient(
			<EventList events={[]} year={2024} />,
		);

		expect(screen.getByText(/No events to show/i)).toBeInTheDocument();
		queryClient.clear();
	});
});
