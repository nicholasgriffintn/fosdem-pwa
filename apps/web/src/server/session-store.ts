import { env } from "cloudflare:workers";
import type { AuthSessionRecord, SessionStore } from "@ngriffin_uk/auth-core";
import { and, eq, gt, lte } from "drizzle-orm";

import { db } from "~/server/db";
import { session as sessionTable } from "~/server/db/schema";

interface SessionRow {
	readonly id: string;
	readonly user_id: number;
	readonly expires_at: string;
	readonly last_extended_at: string;
}

export interface FosdemSessionStoreOptions {
	readonly sessionTtlMs: number;
	readonly refreshWindowMs: number;
	readonly refreshIntervalMs: number;
}

export function createFosdemSessionStore(
	options: FosdemSessionStoreOptions,
): SessionStore {
	return {
		async create(record) {
			await db.insert(sessionTable).values(toSessionInsert(record));
		},
		async findByTokenHash(tokenHash) {
			const row = await findSessionRow(tokenHash);
			return row ? toSessionRecord(row) : null;
		},
		async deleteByTokenHash(tokenHash) {
			await db.delete(sessionTable).where(eq(sessionTable.id, tokenHash));
		},
		async rotateByTokenHash(currentTokenHash, replacement) {
			const insert = toSessionInsert(replacement);
			const [, consumed] = await env.DB.batch<SessionRow>([
				env.DB.prepare(
					`INSERT INTO session (id, user_id, expires_at, last_extended_at)
					 SELECT ?, user_id, ?, ? FROM session
					 WHERE id = ? AND user_id = ? AND expires_at > ?`,
				).bind(
					insert.id,
					insert.expires_at,
					insert.last_extended_at,
					currentTokenHash,
					insert.user_id,
					insert.last_extended_at,
				),
				env.DB.prepare(
					`DELETE FROM session
					 WHERE id = ? AND EXISTS (SELECT 1 FROM session WHERE id = ?)
					 RETURNING id, user_id, expires_at, last_extended_at`,
				).bind(currentTokenHash, insert.id),
			]);
			const row = consumed?.results[0];
			return row ? toSessionRecord(row) : null;
		},
		async touchByTokenHash(tokenHash, expiresAt) {
			const now = new Date(expiresAt.getTime() - options.sessionTtlMs);
			await db
				.update(sessionTable)
				.set({
					expires_at: expiresAt.toISOString(),
					last_extended_at: now.toISOString(),
				})
				.where(
					and(
						eq(sessionTable.id, tokenHash),
						gt(sessionTable.expires_at, now.toISOString()),
						lte(
							sessionTable.expires_at,
							new Date(now.getTime() + options.refreshWindowMs).toISOString(),
						),
						lte(
							sessionTable.last_extended_at,
							new Date(now.getTime() - options.refreshIntervalMs).toISOString(),
						),
					),
				);
			const row = await findSessionRow(tokenHash);
			return row ? toSessionRecord(row) : null;
		},
		async deleteByUserId(userId) {
			const id = Number(userId);
			if (!Number.isSafeInteger(id)) return;
			await db.delete(sessionTable).where(eq(sessionTable.user_id, id));
		},
	};
}

async function findSessionRow(tokenHash: string): Promise<SessionRow | null> {
	const row = await db.query.session.findFirst({
		where: eq(sessionTable.id, tokenHash),
	});
	return row ?? null;
}

function toSessionRecord(row: SessionRow): AuthSessionRecord {
	return {
		tokenHash: row.id,
		userId: String(row.user_id),
		createdAt: new Date(row.last_extended_at),
		expiresAt: new Date(row.expires_at),
	};
}

function toSessionInsert(record: AuthSessionRecord) {
	return {
		id: record.tokenHash,
		user_id: Number(record.userId),
		expires_at: record.expiresAt.toISOString(),
		last_extended_at: record.createdAt.toISOString(),
	};
}
