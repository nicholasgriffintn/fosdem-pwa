import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";

import { createQueryClientWrapper } from "../../utils/queryClient";
import { useFosdemData } from "~/hooks/use-fosdem-data";

vi.mock("@tanstack/react-start", () => ({
	useServerFn: (fn: unknown) => fn,
}));

const fosdemMocks = vi.hoisted(() => ({
	getCoreData: vi.fn(),
	getTracksData: vi.fn(),
	getEventsData: vi.fn(),
	getPersonsData: vi.fn(),
}));

vi.mock("~/server/functions/fosdem", () => fosdemMocks);

import { getCoreData, getTracksData, getEventsData, getPersonsData } from "~/server/functions/fosdem";

const getCoreDataMock = vi.mocked(getCoreData);
const getTracksDataMock = vi.mocked(getTracksData);
const getEventsDataMock = vi.mocked(getEventsData);
const getPersonsDataMock = vi.mocked(getPersonsData);

describe("useFosdemData", () => {
	beforeEach(() => {
		getCoreDataMock.mockReset();
		getTracksDataMock.mockReset();
		getEventsDataMock.mockReset();
		getPersonsDataMock.mockReset();

		getCoreDataMock.mockResolvedValue({
			// @ts-ignore - test
			conference: {},
			days: {},
			types: {},
			buildings: {}
		});
		// @ts-ignore - test
		getTracksDataMock.mockResolvedValue({
			tracks: {},
			rooms: {}
		});
		// @ts-ignore - test
		getEventsDataMock.mockResolvedValue({
			events: {}
		});
		// @ts-ignore - test
		getPersonsDataMock.mockResolvedValue({
			persons: {}
		});
	});

	it("fetches data for a given year", async () => {
		const { wrapper, queryClient } = createQueryClientWrapper();
		const { result } = renderHook(() => useFosdemData({ year: 2024 }), {
			wrapper,
		});

		await waitFor(() => {
			expect(result.current.fosdemData).toBeTruthy();
		});

		expect(getCoreDataMock).toHaveBeenCalledWith({
			data: { year: 2024 },
		});
		expect(getTracksDataMock).toHaveBeenCalledWith({
			data: { year: 2024 },
		});
		expect(getEventsDataMock).toHaveBeenCalledWith({
			data: { year: 2024 },
		});
		expect(getPersonsDataMock).toHaveBeenCalledWith({
			data: { year: 2024 },
		});

		queryClient.clear();
	});
});
