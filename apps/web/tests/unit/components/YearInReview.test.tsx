import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { YearInReview } from "~/components/Profile/Analytics/YearInReview";
import type { UserConferenceStats, User } from "~/server/db/schema";

const createStats = (overrides: Partial<UserConferenceStats> = {}): UserConferenceStats => {
  const timestamp = new Date().toISOString();
  return {
    id: 1,
    user_id: 1,
    year: 2024,
    events_bookmarked: 10,
    events_attended: 8,
    events_attended_in_person: 5,
    events_watched: 3,
    tracks_covered: 4,
    notes_taken: 12,
    total_watch_time_seconds: 7200,
    created_at: timestamp,
    updated_at: timestamp,
    ...overrides,
  };
};

const createUser = (overrides: Partial<User> = {}): User => {
  const timestamp = new Date().toISOString();
  return {
    id: 1,
    name: "Test User",
    avatar_url: null,
    email: "test@example.com",
    github_username: "testuser",
    discord_username: null,
    mastodon_username: null,
    mastodon_acct: null,
    mastodon_url: null,
    gitlab_username: null,
    company: null,
    site: null,
    location: null,
    bio: null,
    twitter_username: null,
    created_at: timestamp,
    updated_at: timestamp,
    setup_at: null,
    terms_accepted_at: null,
    bookmarks_visibility: "private",
    is_guest: false,
    ...overrides,
  };
};

describe("YearInReview", () => {
  it("renders empty state when no stats", () => {
    render(<YearInReview stats={null} user={createUser()} year={2024} />);

    expect(screen.getByText(/Your FOSDEM 2024 Year in Review/i)).toBeInTheDocument();
    expect(screen.getByText(/Mark events as attended or watch recordings to build your year in review/i)).toBeInTheDocument();
  });

  it("renders year in review with stats", () => {
    const stats = createStats();
    const user = createUser();
    render(<YearInReview stats={stats} user={user} year={2024} />);

    expect(screen.getByRole("heading", { name: /FOSDEM 2024/i })).toBeInTheDocument();
    expect(screen.getByText(/Test User/i)).toBeInTheDocument();
  });

  it("shows events attended count", () => {
    const stats = createStats({ events_attended: 8 });
    render(<YearInReview stats={stats} user={createUser()} year={2024} />);

    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText(/Events Attended/i)).toBeInTheDocument();
  });

  it("shows in-person attendance count", () => {
    const stats = createStats({ events_attended_in_person: 5 });
    render(<YearInReview stats={stats} user={createUser()} year={2024} />);

    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText(/In Person/i)).toBeInTheDocument();
  });

  it("calculates completion rate correctly", () => {
    const stats = createStats({ events_bookmarked: 10, events_attended: 8 });
    render(<YearInReview stats={stats} user={createUser()} year={2024} />);

    expect(screen.getByText("80%")).toBeInTheDocument();
  });

  it("shows watch time when available", () => {
    const stats = createStats({ total_watch_time_seconds: 7200 });
    render(<YearInReview stats={stats} user={createUser()} year={2024} />);

    expect(screen.getByText(/2h 0m/i)).toBeInTheDocument();
  });

  it("uses github username when name is not available", () => {
    const stats = createStats();
    const user = createUser({ name: null, github_username: "octocat" });
    render(<YearInReview stats={stats} user={user} year={2024} />);

    expect(screen.getByText(/octocat/i)).toBeInTheDocument();
  });
});
