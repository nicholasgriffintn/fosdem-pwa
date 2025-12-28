import { and, eq } from "drizzle-orm";

import { db } from "~/server/db";
import {
  recordingSnapshot as recordingSnapshotTable,
  type RecordingSnapshot,
} from "~/server/db/schema";

export async function findRecordingSnapshot(
  slug: string,
  year: number,
): Promise<RecordingSnapshot | undefined> {
  return db.query.recordingSnapshot.findFirst({
    where: and(
      eq(recordingSnapshotTable.slug, slug),
      eq(recordingSnapshotTable.year, year),
    ),
  });
}

export async function findRecordingsForYear(
  year: number,
): Promise<RecordingSnapshot[]> {
  return db
    .select()
    .from(recordingSnapshotTable)
    .where(
      and(
        eq(recordingSnapshotTable.year, year),
        eq(recordingSnapshotTable.has_recording, true),
      ),
    );
}
