import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";

import { createQueryClientWrapper } from "../../utils/queryClient";
import { useFosdemData } from "~/hooks/use-fosdem-data";

vi.mock("@tanstack/react-start", () => ({
	useServerFn: (fn: unknown) => fn,
}));

const fosdemMocks = vi.hoisted(() => ({
	getAllData: vi.fn(),
}));

vi.mock("~/server/functions/fosdem", () => fosdemMocks);

import { getAllData } from "~/server/functions/fosdem";

const getAllDataMock = vi.mocked(getAllData);

describe("useFosdemData", () => {
	beforeEach(() => {
		getAllDataMock.mockReset();
		// @ts-ignore - test
		getAllDataMock.mockResolvedValue({ conference: {}, events: {}, tracks: {} });
	});

	it("fetches data for a given year", async () => {
		const { wrapper, queryClient } = createQueryClientWrapper();
		const { result } = renderHook(() => useFosdemData({ year: 2024 }), {
			wrapper,
		});

		await waitFor(() => {
			expect(result.current.fosdemData).toBeTruthy();
		});
		expect(getAllDataMock).toHaveBeenCalledWith({
			data: { year: 2024 },
		});
		queryClient.clear();
	});
});
