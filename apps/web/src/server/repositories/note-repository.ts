import { and, eq } from "drizzle-orm";

import { db } from "~/server/db";
import { note as noteTable, type Note } from "~/server/db/schema";

export async function findNotesByUserAndEvent(
  userId: number,
  year: number,
  slug: string,
): Promise<Note[]> {
  return db.query.note.findMany({
    where: and(
      eq(noteTable.user_id, userId),
      eq(noteTable.year, year),
      eq(noteTable.slug, slug),
    ),
  });
}

export async function findNoteById(
  id: number,
  userId: number,
): Promise<Note | undefined> {
  return db.query.note.findFirst({
    where: and(eq(noteTable.id, id), eq(noteTable.user_id, userId)),
  });
}

export async function createNote(
  userId: number,
  year: number,
  slug: string,
  note: string,
  time?: number,
): Promise<void> {
  await db.insert(noteTable).values({
    note,
    time,
    year,
    slug,
    user_id: userId,
  });
}

export async function updateNote(
  id: number,
  updates: Partial<Pick<Note, "note" | "time">>,
): Promise<void> {
  await db.update(noteTable).set(updates).where(eq(noteTable.id, id));
}

export async function deleteNote(id: number): Promise<void> {
  await db.delete(noteTable).where(eq(noteTable.id, id));
}
