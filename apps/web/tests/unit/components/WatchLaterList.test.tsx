import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { TooltipProvider } from "~/components/ui/tooltip";
import { WatchLaterList } from "~/components/WatchLater/WatchLaterList";
import type { Bookmark } from "~/server/db/schema";
import type { Conference } from "~/types/fosdem";

const routerMocks = vi.hoisted(() => ({
  Link: ({ children, ...props }: { children: ReactNode }) => (
    <a {...props}>{children}</a>
  ),
  useNavigate: () => () => { },
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
    types: {},
    buildings: {},
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
    tracks: {},
    events: {
      "event-1": {
        id: "event-1",
        title: "Intro to FOSDEM",
        subtitle: "",
        description: "Welcome session",
        room: "H.1302",
        persons: ["Speaker One"],
        startTime: "09:00",
        duration: "01:00",
        abstract: "",
        chat: "",
        links: [{ type: "video/mp4", href: "https://video.fosdem.org/event-1.mp4", title: "Video" }],
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

const createBookmark = (overrides: Partial<Bookmark> = {}): Bookmark => {
  const timestamp = new Date().toISOString();
  return {
    id: "2024_event-1",
    year: 2024,
    slug: "event-1",
    type: "bookmark_event",
    status: "favourited",
    user_id: 1,
    priority: null,
    last_notification_sent_at: null,
    watch_later: true,
    watch_status: "unwatched",
    watch_progress_seconds: 0,
    playback_speed: "1",
    last_watched_at: null,
    attended: false,
    attended_at: null,
    attended_in_person: false,
    created_at: timestamp,
    updated_at: timestamp,
    ...overrides,
  };
};

describe("WatchLaterList", () => {
  const renderWithClient = (ui: ReactNode) => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const result = render(
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>{ui}</TooltipProvider>
      </QueryClientProvider>,
    );
    return { ...result, queryClient };
  };

  it("renders empty state when no items", () => {
    const { queryClient } = renderWithClient(
      <WatchLaterList
        items={[]}
        fosdemData={createFosdemData()}
        year={2024}
        loading={false}
        onToggleWatchLater={vi.fn()}
        onMarkAsWatched={vi.fn()}
      />,
    );

    expect(screen.getByText(/No items in this category/i)).toBeInTheDocument();
    queryClient.clear();
  });

  it("renders watch later items with event details", () => {
    const fosdemData = createFosdemData();
    const bookmarks = [createBookmark()];

    const { queryClient } = renderWithClient(
      <WatchLaterList
        items={bookmarks}
        fosdemData={fosdemData}
        year={2024}
        loading={false}
        onToggleWatchLater={vi.fn()}
        onMarkAsWatched={vi.fn()}
      />,
    );

    expect(screen.getByText(/Intro to FOSDEM/i)).toBeInTheDocument();
    expect(screen.getByText(/H.1302/i)).toBeInTheDocument();
    expect(screen.getByText(/Speaker One/i)).toBeInTheDocument();
    queryClient.clear();
  });

  it("renders view event button for items", () => {
    const fosdemData = createFosdemData();
    const bookmarks = [createBookmark()];

    const { queryClient } = renderWithClient(
      <WatchLaterList
        items={bookmarks}
        fosdemData={fosdemData}
        year={2024}
        loading={false}
        onToggleWatchLater={vi.fn()}
        onMarkAsWatched={vi.fn()}
      />,
    );

    expect(screen.getByText(/View Event/i)).toBeInTheDocument();
    queryClient.clear();
  });

  it("renders event time information", () => {
    const fosdemData = createFosdemData();
    const bookmarks = [createBookmark({ watch_progress_seconds: 300, watch_status: "watching" })];

    const { queryClient } = renderWithClient(
      <WatchLaterList
        items={bookmarks}
        fosdemData={fosdemData}
        year={2024}
        loading={false}
        onToggleWatchLater={vi.fn()}
        onMarkAsWatched={vi.fn()}
      />,
    );

    expect(screen.getByText(/09:00/)).toBeInTheDocument();
    queryClient.clear();
  });

  it("shows loading state", () => {
    const { queryClient } = renderWithClient(
      <WatchLaterList
        items={[]}
        fosdemData={createFosdemData()}
        year={2024}
        loading={true}
        onToggleWatchLater={vi.fn()}
        onMarkAsWatched={vi.fn()}
      />,
    );

    expect(screen.getByText(/Loading watch later/i)).toBeInTheDocument();
    queryClient.clear();
  });
});
