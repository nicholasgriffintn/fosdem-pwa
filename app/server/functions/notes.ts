import { and } from "drizzle-orm";
import { createServerFn } from "@tanstack/start";
import { eq } from "drizzle-orm";

import { db } from "~/server/db";
import { note as noteTable } from "~/server/db/schema";
import { getFullAuthSession } from "~/server/auth";

export const getNotes = createServerFn({
	method: "GET",
})
	.validator((data: { year: number; eventId: string }) => data)
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
	.validator(
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

			return { error: "Failed to save note" };
		}
	});
