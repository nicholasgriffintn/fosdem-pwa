import { createAPIFileRoute } from '@tanstack/start/api'
import { eq, and } from "drizzle-orm";

import { db } from "~/server/db";
import { user as userTable } from "~/server/db/schema";
import { note as noteSchema } from "~/server/db/schema";

export const APIRoute = createAPIFileRoute(
  '/api/user/github/$userId/notes/$year/$eventId',
)({
  GET: async ({ params }) => {
    const userId = params.userId;
    const year = params.year;
    const eventId = params.eventId;

    if (!userId) {
      return Response.json({ error: "User ID is required" }, { status: 400 });
    }

    const user = await db.query.user.findFirst({
      where: eq(userTable.github_username, userId),
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const notes = await db.query.note.findMany({
      where: and(
        eq(noteSchema.user_id, user.id),
        eq(noteSchema.year, Number(year)),
        eq(noteSchema.slug, eventId),
      ),
    });

    return Response.json(notes);
  },
  POST: async ({ params, request }) => {
    const userId = params.userId;
    const year = params.year;
    const eventId = params.eventId;

    const { note, time } = await request.json();

    if (!userId) {
      return Response.json({ error: "User ID is required" }, { status: 400 });
    }

    if (!note) {
      return Response.json({ error: "Note is required" }, { status: 400 });
    }

    const user = await db.query.user.findFirst({
      where: eq(userTable.github_username, userId),
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    try {
      await db.insert(noteSchema).values({
        note,
        time,
        year: Number(year),
        slug: eventId,
        user_id: user.id,
      });

      return Response.json({ success: true });
    } catch (error) {
      console.error(error);

      return Response.json({ error: "Failed to save note" }, { status: 500 });
    }
  },
});

