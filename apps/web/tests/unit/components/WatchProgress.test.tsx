import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WatchProgress } from "~/components/WatchLater/WatchProgress";

describe("WatchProgress", () => {
	it("returns null when unwatched with no progress", () => {
		const { container } = render(
			<WatchProgress
				progressSeconds={0}
				watchStatus="unwatched"
			/>,
		);

		expect(container.firstChild).toBeNull();
	});

	it("shows progress bar when there is progress", () => {
		render(
			<WatchProgress
				progressSeconds={300}
				durationSeconds={3600}
				watchStatus="watching"
			/>,
		);

		expect(screen.getByText(/In progress/i)).toBeInTheDocument();
		expect(screen.getByText(/5:00/)).toBeInTheDocument();
	});

	it("shows watched status", () => {
		render(
			<WatchProgress
				progressSeconds={3600}
				durationSeconds={3600}
				watchStatus="watched"
			/>,
		);

		expect(screen.getByText(/Watched/i)).toBeInTheDocument();
	});

	it("formats time correctly for hours", () => {
		render(
			<WatchProgress
				progressSeconds={3661}
				durationSeconds={7200}
				watchStatus="watching"
			/>,
		);

		expect(screen.getByText(/1:01:01/)).toBeInTheDocument();
	});

	it("hides label when showLabel is false", () => {
		render(
			<WatchProgress
				progressSeconds={300}
				durationSeconds={3600}
				watchStatus="watching"
				showLabel={false}
			/>,
		);

		expect(screen.queryByText(/In progress/i)).not.toBeInTheDocument();
	});
});
