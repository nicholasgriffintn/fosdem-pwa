import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { createRef } from "react";

import { EventNotes } from "~/components/Event/EventNotes";

const notesModule = vi.hoisted(() => ({
	useNotes: vi.fn(),
}));

vi.mock("~/hooks/use-notes", () => notesModule);

const useNotesMock = vi.mocked(notesModule.useNotes);

const toastMock = vi.fn();

vi.mock("~/hooks/use-toast", () => ({
	toast: (...args: unknown[]) => toastMock(...args),
}));

const playerModule = vi.hoisted(() => ({
	usePlayer: vi.fn(),
}));

vi.mock("~/contexts/PlayerContext", () => playerModule);

const usePlayerMock = vi.mocked(playerModule.usePlayer);

const baseEvent = {
	id: "event-1",
} as any;

describe("EventNotes", () => {
	beforeEach(() => {
		useNotesMock.mockReset();
		toastMock.mockReset();
		usePlayerMock.mockReset();
		useNotesMock.mockReturnValue({
			notes: [
				{
					id: "note-1",
					note: "Remember this",
					created_at: new Date().toISOString(),
					time: 120,
				},
			],
			loading: false,
			create: vi.fn(),
		});
	});

	it("plays video when clicking on timestamps", () => {
		const videoRef = createRef<HTMLVideoElement>();
		const play = vi.fn();
		videoRef.current = { currentTime: 0, play } as unknown as HTMLVideoElement;

		usePlayerMock.mockReturnValue({
			videoRef,
		} as any);

		render(
			<EventNotes
				year={2024}
				event={baseEvent}
				isMobile={false}
			/>,
		);

		const timestampButton = screen.getByRole("button", { name: /@/i });
		fireEvent.click(timestampButton);

		expect(videoRef.current?.currentTime).toBe(120);
		expect(play).toHaveBeenCalled();
	});

	it("saves a new note and notifies the user", () => {
		const createMock = vi.fn();
		useNotesMock.mockReturnValue({
			notes: [],
			loading: false,
			create: createMock,
		});

		const videoRef = createRef<HTMLVideoElement>();
		videoRef.current = { currentTime: 10, play: vi.fn() } as any;

		usePlayerMock.mockReturnValue({
			videoRef,
		} as any);

		render(
			<EventNotes
				year={2024}
				event={baseEvent}
				isMobile={false}
			/>,
		);

		const textarea = screen.getByLabelText(/Add a note/i);
		fireEvent.change(textarea, { target: { value: "New note" } });
		const saveButton = screen.getByRole("button", { name: /save/i });
		fireEvent.click(saveButton);

		expect(createMock).toHaveBeenCalledWith(
			expect.objectContaining({
				note: "New note",
			}),
		);
		expect(toastMock).toHaveBeenCalledWith(
			expect.objectContaining({ title: "Note saved" }),
		);
	});
});
