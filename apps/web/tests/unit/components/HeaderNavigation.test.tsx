import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	Outlet,
	RouterProvider,
} from "@tanstack/react-router";
import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HeaderSearch } from "~/components/Header/HeaderSearch";
import { MainNav } from "~/components/Header/MainNav";

vi.mock("~/hooks/use-conference-data", () => ({
	useConferenceData: () => ({ scheduleData: null, loading: false }),
}));

describe("header navigation", () => {
	beforeEach(() => {
		vi.spyOn(window, "scrollTo").mockImplementation(() => {});
	});
	it("closes the menu and clears search after navigation", async () => {
		const root = createRootRoute({
			component: () => (
				<>
					<MainNav title="FOSDEM PWA" year={2026} />
					<HeaderSearch year={2026} />
					<Outlet />
				</>
			),
		});
		const home = createRoute({
			getParentRoute: () => root,
			path: "/",
			component: () => <p>Schedule</p>,
		});
		const rooms = createRoute({
			getParentRoute: () => root,
			path: "/rooms",
			component: () => <p>Rooms</p>,
		});
		const router = createRouter({
			routeTree: root.addChildren([home, rooms]),
			history: createMemoryHistory({ initialEntries: ["/"] }),
		});
		render(<RouterProvider router={router} />);
		await screen.findByText("Schedule");
		fireEvent.click(
			screen.getByRole("checkbox", { name: "Toggle mobile menu" }),
		);
		fireEvent.click(screen.getByRole("button", { name: "Open search" }));
		fireEvent.change(screen.getByRole("searchbox", { name: "Search events" }), {
			target: { value: "Rust" },
		});
		expect(screen.getByRole("checkbox")).toBeChecked();
		expect(screen.getByRole("searchbox")).toHaveValue("Rust");

		await act(async () => {
			await router.navigate({
				to: "/rooms",
				search: { year: 2026, day: null },
			});
		});
		await screen.findByText("Rooms");
		await waitFor(() => {
			expect(screen.getByRole("checkbox")).not.toBeChecked();
			expect(screen.getByRole("searchbox")).toHaveValue("");
			expect(
				screen.getByRole("button", { name: "Open search" }),
			).toBeInTheDocument();
		});
	});
});
