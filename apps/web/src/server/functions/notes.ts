import { createServerFn } from "@tanstack/react-start";

import { getAuthUser } from "~/server/lib/auth-middleware";
import { ok, err, type Result } from "~/server/lib/result";
import {
	findNotesByUserAndEvent,
	findNoteById,
	createNote as createNoteRepo,
	updateNote as updateNoteRepo,
	deleteNote as deleteNoteRepo,
} from "~/server/repositories/note-repository";
import type { Note } from "~/server/db/schema";

export const getNotes = createServerFn({
	method: "GET",
})
	.inputValidator((data: { year: number; eventId: string }) => data)
	.handler(async (ctx): Promise<Note[]> => {
		const { year, eventId } = ctx.data;

		const user = await getAuthUser();
		if (!user) {
			return [];
		}

		return findNotesByUserAndEvent(user.id, Number(year), eventId);
	});

export const createNote = createServerFn({
	method: "POST",
})
	.inputValidator(
		(data: { year: number; eventId: string; note: string; time?: number }) =>
			data,
	)
	.handler(async (ctx): Promise<Result<boolean>> => {
		const { year, eventId, note, time } = ctx.data;

		if (!note) {
			return err("Note content is required");
		}

		const user = await getAuthUser();
		if (!user) {
			return err("User not found");
		}

		try {
			await createNoteRepo(user.id, Number(year), eventId, note, time);
			return ok(true);
		} catch (error) {
			console.error(error);
			return err("Failed to save note");
		}
	});

export const updateNote = createServerFn({
	method: "POST",
})
	.inputValidator((data: { id: number; updates: Record<string, unknown> }) => data)
	.handler(async (ctx): Promise<Result<boolean>> => {
		const { id, updates } = ctx.data;

		const allowedFields = ["note", "time"] as const;
		type AllowedField = (typeof allowedFields)[number];
		const safeUpdates: Partial<Pick<Note, AllowedField>> = {};

		for (const [key, value] of Object.entries(updates ?? {})) {
			if (allowedFields.includes(key as AllowedField)) {
				(safeUpdates as Record<string, unknown>)[key] = value;
			}
		}

		if (Object.keys(safeUpdates).length === 0) {
			return err("No valid note fields to update");
		}

		const user = await getAuthUser();
		if (!user) {
			return err("User not found");
		}

		const existingNote = await findNoteById(id, user.id);
		if (!existingNote) {
			return err("Note not found");
		}

		try {
			await updateNoteRepo(id, safeUpdates);
			return ok(true);
		} catch (error) {
			console.error(error);
			return err("Failed to update note");
		}
	});

export const deleteNote = createServerFn({
	method: "POST",
})
	.inputValidator((data: { id: number }) => data)
	.handler(async (ctx): Promise<Result<boolean>> => {
		const { id } = ctx.data;

		const user = await getAuthUser();
		if (!user) {
			return err("User not found");
		}

		const existingNote = await findNoteById(id, user.id);
		if (!existingNote) {
			return err("Note not found");
		}

		try {
			await deleteNoteRepo(id);
			return ok(true);
		} catch (error) {
			console.error(error);
			return err("Failed to delete note");
		}
	});
