import { and } from "drizzle-orm";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";

import { db } from "~/server/db";
import { note as noteTable } from "~/server/db/schema";
import { getFullAuthSession } from "~/server/auth";

export const getNotes = createServerFn({
	method: "GET",
})
	.inputValidator((data: { year: number; eventId: string }) => data)
	.handler(async (ctx: any) => {
		const { year, eventId } = ctx.data;

		const { user } = await getFullAuthSession();

		if (!user) {
			return [];
		}

		const notes = await db.query.note.findMany({
			where: and(
				eq(noteTable.user_id, user.id),
				eq(noteTable.year, Number(year)),
				eq(noteTable.slug, eventId),
			),
		});

		if (!notes) {
			return [];
		}

		return notes;
	});

export const createNote = createServerFn({
	method: "POST",
})
	.inputValidator(
		(data: { year: number; eventId: string; note: string; time?: number }) =>
			data,
	)
	.handler(async (ctx: any) => {
		const { year, eventId, note, time } = ctx.data;

		if (!note) {
			throw new Error("Note is required");
		}

		const { user } = await getFullAuthSession();

		if (!user) {
			throw new Error("User not found");
		}

		try {
			await db.insert(noteTable).values({
				note,
				time,
				year: Number(year),
				slug: eventId,
				user_id: user.id,
			});

			return { success: true };
		} catch (error) {
			console.error(error);

			return { success: false, error: "Failed to save note" };
		}
	});

export const updateNote = createServerFn({
	method: "POST",
})
	.inputValidator((data: { id: number; updates: any }) => data)
	.handler(async (ctx: any) => {
		const { id, updates } = ctx.data;

		const allowedFields = ["note", "time"] as const;
		const safeUpdates = Object.entries(updates ?? {}).reduce<
			Record<string, unknown>
		>((acc, [key, value]) => {
			if (allowedFields.includes(key as (typeof allowedFields)[number])) {
				acc[key] = value;
			}
			return acc;
		}, {});

		if (Object.keys(safeUpdates).length === 0) {
			return { success: false, error: "No valid note fields to update" };
		}

		const { user } = await getFullAuthSession();

		if (!user) {
			throw new Error("User not found");
		}

		const existingNote = await db.query.note.findFirst({
			where: and(eq(noteTable.id, id), eq(noteTable.user_id, user.id)),
		});

		if (!existingNote) {
			throw new Error("Note not found");
		}

		try {
			await db.update(noteTable).set(safeUpdates).where(eq(noteTable.id, id));

			return { success: true };
		} catch (error) {
			console.error(error);
			return { success: false, error: "Failed to update note" };
		}
	});

export const deleteNote = createServerFn({
	method: "POST",
})
	.inputValidator((data: { id: number }) => data)
	.handler(async (ctx: any) => {
		const { id } = ctx.data;

		const { user } = await getFullAuthSession();

		if (!user) {
			throw new Error("User not found");
		}

		const existingNote = await db.query.note.findFirst({
			where: and(eq(noteTable.id, id), eq(noteTable.user_id, user.id)),
		});

		if (!existingNote) {
			throw new Error("Note not found");
		}

		try {
			await db.delete(noteTable).where(eq(noteTable.id, id));

			return { success: true };
		} catch (error) {
			console.error(error);
			return { success: false, error: "Failed to delete note" };
		}
	});
