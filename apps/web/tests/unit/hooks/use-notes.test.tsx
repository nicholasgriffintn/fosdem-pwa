import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createQueryClientWrapper } from "../../utils/queryClient";
import { useNotes } from "~/hooks/use-notes";

vi.mock("@tanstack/react-start", () => ({
	useServerFn: (fn: unknown) => fn,
}));

const localNotesModule = vi.hoisted(() => ({
	useLocalNotes: vi.fn(),
}));

vi.mock("~/hooks/use-local-notes", () => localNotesModule);

const useLocalNotesMock = vi.mocked(localNotesModule.useLocalNotes);

const localStorageMocks = vi.hoisted(() => ({
	saveLocalNote: vi.fn(),
	updateLocalNote: vi.fn(),
	addToSyncQueue: vi.fn(),
}));

vi.mock("~/lib/localStorage", () => localStorageMocks);

const noteServerMocks = vi.hoisted(() => ({
	getNotes: vi.fn(),
	createNote: vi.fn(),
}));

vi.mock("~/server/functions/notes", () => noteServerMocks);

vi.mock("~/hooks/use-auth", () => ({
	useAuth: vi.fn(),
}));

import { useAuth } from "~/hooks/use-auth";
import { saveLocalNote, updateLocalNote, addToSyncQueue } from "~/lib/localStorage";
import { getNotes, createNote } from "~/server/functions/notes";

const useAuthMock = vi.mocked(useAuth);
const saveLocalNoteMock = vi.mocked(saveLocalNote);
const updateLocalNoteMock = vi.mocked(updateLocalNote);
const addToSyncQueueMock = vi.mocked(addToSyncQueue);
const getNotesMock = vi.mocked(getNotes);
const createNoteMock = vi.mocked(createNote);

const localNote = {
	id: "local-note",
	year: 2024,
	slug: "event-1",
	note: "Remember this",
	time: 120,
	created_at: new Date().toISOString(),
	updated_at: new Date().toISOString(),
};

const serverNote = {
	id: 10,
	year: 2024,
	slug: "event-1",
	note: "Server note",
	time: 60,
	user_id: 1,
	created_at: new Date().toISOString(),
	updated_at: new Date().toISOString(),
};

const event = {
	id: "event-1",
	title: "Talk",
	subtitle: "",
	description: "",
	abstract: "",
	persons: [],
	startTime: "10:00",
	duration: "00:30",
	room: "Room1",
	trackKey: "track1",
	day: "1",
	chat: "",
	links: [],
	attachments: [],
	streams: [],
	isLive: false,
	status: "confirmed",
	type: "lecture",
	url: "",
	feedbackUrl: "",
	language: "en",
};

describe("useNotes", () => {
	beforeEach(() => {
		useLocalNotesMock.mockReset();
		saveLocalNoteMock.mockReset();
		updateLocalNoteMock.mockReset();
		addToSyncQueueMock.mockReset();
		getNotesMock.mockReset();
		createNoteMock.mockReset();
		useAuthMock.mockReturnValue({ user: { id: "user-1" }, loading: false, logout: vi.fn() });
		useLocalNotesMock.mockReturnValue({ notes: [localNote], loading: false });
		getNotesMock.mockResolvedValue([serverNote]);
		createNoteMock.mockResolvedValue({ success: true, data: true });
	});

	it("falls back to local notes when user is not authenticated", async () => {
		useAuthMock.mockReturnValue({ user: null, loading: false, logout: vi.fn() });

		const { wrapper, queryClient } = createQueryClientWrapper();
		const { result } = renderHook(() => useNotes({ year: 2024, event }), {
			wrapper,
		});

		await waitFor(() => {
			expect(result.current.notes).toHaveLength(1);
		});

		expect(result.current.notes[0]?.note).toBe("Remember this");
		queryClient.clear();
	});

	it("merges server notes with local notes for authenticated users", async () => {
		const { wrapper, queryClient } = createQueryClientWrapper();
		const { result } = renderHook(() => useNotes({ year: 2024, event }), {
			wrapper,
		});

		await waitFor(() => {
			expect(result.current.notes.some((note) => 'serverId' in note && note.serverId === 10)).toBe(
				true,
			);
		});
		queryClient.clear();
	});

	it("queues note creation when offline", async () => {
		const originalNavigator = window.navigator;
		Object.defineProperty(window, "navigator", {
			value: { onLine: false },
			configurable: true,
		});

		saveLocalNoteMock.mockResolvedValue({
			...localNote,
			id: "queued",
		});

		const { wrapper, queryClient } = createQueryClientWrapper();
		const { result } = renderHook(() => useNotes({ year: 2024, event }), {
			wrapper,
		});

		await act(async () => {
			result.current.create({
				note: "Queued note",
				tempId: "temp-id",
			});
		});

		expect(addToSyncQueueMock).toHaveBeenCalledWith(
			expect.objectContaining({
				id: "queued",
				type: "note",
				action: "create",
			}),
		);
		expect(createNoteMock).not.toHaveBeenCalled();
		queryClient.clear();

		Object.defineProperty(window, "navigator", {
			value: originalNavigator,
			configurable: true,
		});
	});
});
const originalNavigator = window.navigator;
