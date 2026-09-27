import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";

import { createQueryClientWrapper } from "../../utils/queryClient";
import { useConferenceData } from "~/hooks/use-conference-data";
import { testConferenceData } from "~/data/test-data";

vi.mock("@tanstack/react-start", () => ({
	useServerFn: (fn: unknown) => fn,
}));

const fosdemMocks = vi.hoisted(() => ({
	getAllData: vi.fn(),
}));

vi.mock("~/server/functions/schedule", () => fosdemMocks);

import { getAllData } from "~/server/functions/schedule";

const getAllDataMock = vi.mocked(getAllData);

describe("useConferenceData", () => {
	beforeEach(() => {
		getAllDataMock.mockReset();
		getAllDataMock.mockResolvedValue({
			conference: testConferenceData,
			events: {},
			tracks: {},
			types: {},
			buildings: {},
			rooms: {},
			days: {},
		});
	});

	it("fetches data for a given year", async () => {
		const { wrapper, queryClient } = createQueryClientWrapper();
		const { result } = renderHook(() => useConferenceData({ year: 2024 }), {
			wrapper,
		});

		await waitFor(() => {
			expect(result.current.scheduleData).toBeTruthy();
		});
		expect(getAllDataMock).toHaveBeenCalledWith({
			data: { year: 2024 },
		});
		queryClient.clear();
	});
});
