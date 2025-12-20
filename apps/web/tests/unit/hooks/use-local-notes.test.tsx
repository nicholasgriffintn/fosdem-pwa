import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createQueryClientWrapper } from "../../utils/queryClient";
import { useLocalNotes } from "~/hooks/use-local-notes";

const localStorageMocks = vi.hoisted(() => ({
	getLocalNotes: vi.fn(),
	saveLocalNote: vi.fn(),
	updateLocalNote: vi.fn(),
	removeLocalNote: vi.fn(),
}));

vi.mock("~/lib/localStorage", () => localStorageMocks);

import {
	getLocalNotes,
	saveLocalNote,
	updateLocalNote,
	removeLocalNote,
} from "~/lib/localStorage";

const getLocalNotesMock = vi.mocked(getLocalNotes);
const saveLocalNoteMock = vi.mocked(saveLocalNote);
const updateLocalNoteMock = vi.mocked(updateLocalNote);
const removeLocalNoteMock = vi.mocked(removeLocalNote);

const allNotes = [
	{
		id: "note-1",
		year: 2024,
		slug: "event-a",
		note: "first",
		time: 1,
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
	},
	{
		id: "note-2",
		year: 2024,
		slug: "other",
		note: "second",
		time: 2,
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
	},
];

describe("useLocalNotes", () => {
	beforeEach(() => {
		getLocalNotesMock.mockReset();
		saveLocalNoteMock.mockReset();
		updateLocalNoteMock.mockReset();
		removeLocalNoteMock.mockReset();
		getLocalNotesMock.mockResolvedValue(allNotes);
	});

	it("filters notes to the provided slug", async () => {
		const { wrapper, queryClient } = createQueryClientWrapper();

		const { result } = renderHook(
			() => useLocalNotes({ year: 2024, slug: "event-a" }),
			{ wrapper },
		);

		await waitFor(() => {
			expect(result.current.notes).toHaveLength(1);
		});
		expect(result.current.notes[0]?.slug).toBe("event-a");
		queryClient.clear();
	});

	it("saves a new note and invalidates the query", async () => {
		saveLocalNoteMock.mockResolvedValue({
			id: "new-note",
			year: 2024,
			slug: "event-a",
			note: "Hello",
			time: undefined,
		} as any);

		const { wrapper, queryClient } = createQueryClientWrapper();
		const { result } = renderHook(
			() => useLocalNotes({ year: 2024, slug: "event-a" }),
			{ wrapper },
		);

		await act(async () => {
			result.current.saveNote({
				year: 2024,
				slug: "event-a",
				note: "Hello",
			});
		});

		expect(saveLocalNoteMock).toHaveBeenCalledWith(
			expect.objectContaining({ note: "Hello", slug: "event-a" }),
			undefined,
		);
		queryClient.clear();
	});

	it("updates and deletes notes using storage helpers", async () => {
		const { wrapper, queryClient } = createQueryClientWrapper();
		const { result } = renderHook(
			() => useLocalNotes({ year: 2024, slug: "event-a" }),
			{ wrapper },
		);

		await act(async () => {
			result.current.updateNote({
				id: "note-1",
				updates: { note: "Updated" },
			});
		});
		await act(async () => {
			result.current.deleteNote("note-1");
		});

		expect(updateLocalNoteMock).toHaveBeenCalledWith(
			"note-1",
			expect.objectContaining({ note: "Updated" }),
		);
		expect(removeLocalNoteMock).toHaveBeenCalledWith("note-1");
		queryClient.clear();
	});
});
