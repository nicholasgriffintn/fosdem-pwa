import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ConferenceStats } from "~/components/Analytics/ConferenceStats";
import type { UserConferenceStats } from "~/server/db/schema";

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

describe("ConferenceStats", () => {
	it("renders loading state", () => {
		render(<ConferenceStats stats={null} loading={true} />);

		const skeletons = document.querySelectorAll(".animate-pulse");
		expect(skeletons.length).toBeGreaterThan(0);
	});

	it("renders empty state when no stats", () => {
		render(<ConferenceStats stats={null} loading={false} />);

		expect(screen.getByText(/No stats available yet/i)).toBeInTheDocument();
	});

	it("renders all stat cards", () => {
		const stats = createStats();
		render(<ConferenceStats stats={stats} loading={false} />);

		expect(screen.getByText("10")).toBeInTheDocument();
		expect(screen.getByText("8")).toBeInTheDocument();
		expect(screen.getByText("5")).toBeInTheDocument();
		expect(screen.getByText("3")).toBeInTheDocument();
		expect(screen.getByText("4")).toBeInTheDocument();
		expect(screen.getByText("12")).toBeInTheDocument();
	});

	it("formats watch time correctly", () => {
		const stats = createStats({ total_watch_time_seconds: 7200 });
		render(<ConferenceStats stats={stats} loading={false} />);

		expect(screen.getByText("2h 0m")).toBeInTheDocument();
	});

	it("calculates completion rate", () => {
		const stats = createStats({ events_bookmarked: 10, events_attended: 8 });
		render(<ConferenceStats stats={stats} loading={false} />);

		expect(screen.getByText("80%")).toBeInTheDocument();
	});

	it("shows 0% completion when no bookmarks", () => {
		const stats = createStats({ events_bookmarked: 0, events_attended: 0 });
		render(<ConferenceStats stats={stats} loading={false} />);

		expect(screen.getByText("0%")).toBeInTheDocument();
	});
});
