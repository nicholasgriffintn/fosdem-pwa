import { and, or, sql } from "drizzle-orm";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";

import { db } from "~/server/db";
import {
	bookmark as bookmarkTable,
	user as userTable,
} from "~/server/db/schema";
import { getFullAuthSession } from "~/server/auth";

type BookmarkPayload = {
	year: number;
	type: string;
	slug: string;
	status: string;
};

async function upsertBookmark(payload: BookmarkPayload, userId: number) {
	const { year, type, slug, status } = payload;
	const yearNum = Number.parseInt(String(year));
	if (!Number.isFinite(yearNum) || yearNum < 2000 || yearNum > 2100) {
		throw new Error("Invalid year parameter");
	}

	const existingBookmark = await db.query.bookmark.findFirst({
		where: and(
			eq(bookmarkTable.user_id, userId),
			eq(bookmarkTable.year, yearNum),
			eq(bookmarkTable.slug, slug),
		),
	});

	if (existingBookmark) {
		await db
			.update(bookmarkTable)
			.set({ status })
			.where(eq(bookmarkTable.id, existingBookmark.id));
	} else {
		await db
			.insert(bookmarkTable)
			.values({
				id: `${userId}_${yearNum}_${slug}`,
				slug,
				type: `bookmark_${type}`,
				year: yearNum,
				status,
				user_id: userId,
			})
			.onConflictDoUpdate({
				target: bookmarkTable.id,
				set: { status },
			});
	}
}

export const getBookmarks = createServerFn({
	method: "GET",
})
	.inputValidator(
		(data: { year: number; status: "favourited" | "unfavourited" }) => data,
	)
	.handler(async (ctx) => {
		const { year, status } = ctx.data;

		const yearNum = Number.parseInt(String(year));
		if (!Number.isFinite(yearNum) || yearNum < 2000 || yearNum > 2100) {
			throw new Error("Invalid year parameter");
		}

		const { user } = await getFullAuthSession();

		if (!user) {
			return [];
		}

		const bookmarkData = await db.query.bookmark.findMany({
			where: and(
				eq(bookmarkTable.user_id, user.id),
				eq(bookmarkTable.year, yearNum),
				eq(bookmarkTable.status, status),
			),
		});

		if (!bookmarkData) {
			return [];
		}

		return bookmarkData;
	});

export const getEventBookmark = createServerFn({
	method: "GET",
})
	.inputValidator((data: { year: number; slug: string }) => data)
	.handler(async (ctx) => {
		const { year, slug } = ctx.data;

		const yearNum = Number.parseInt(String(year));
		if (!Number.isFinite(yearNum) || yearNum < 2000 || yearNum > 2100) {
			throw new Error("Invalid year parameter");
		}

		const { user } = await getFullAuthSession();

		if (!user) {
			return null;
		}

		const existingBookmark = await db.query.bookmark.findFirst({
			where: and(
				eq(bookmarkTable.user_id, user.id),
				eq(bookmarkTable.year, yearNum),
				eq(bookmarkTable.slug, slug),
			),
		});

		return existingBookmark;
	});

export const createBookmark = createServerFn({
	method: "POST",
})
	.inputValidator(
		(data: {
			year: number;
			type: string;
			slug: string;
			status: string;
			returnTo?: string;
		}) => data,
	)
	.handler(async (ctx) => {
		const { year, type, slug, status, returnTo } = ctx.data;

		if (!type || !slug || !status) {
			throw new Error("Invalid request");
		}

		const { user } = await getFullAuthSession();

		if (!user) {
			if (returnTo) {
				return new Response(null, {
					status: 303,
					headers: {
						Location: returnTo.startsWith("/") ? returnTo : "/signin",
					},
				});
			}
			return null;
		}

		try {
			await upsertBookmark({ year, type, slug, status }, user.id);

			if (returnTo) {
				return new Response(null, {
					status: 303,
					headers: {
						Location: returnTo.startsWith("/") ? returnTo : "/",
					},
				});
			}

			return { success: true };
		} catch (error) {
			console.error(error);

			if (returnTo) {
				return new Response(null, {
					status: 303,
					headers: {
						Location: returnTo.startsWith("/") ? returnTo : "/",
					},
				});
			}

			return { success: false, error: "Failed to save bookmark" };
		}
	});

export const createBookmarkFromForm = createServerFn({
	method: "POST",
})
	.inputValidator((data: FormData) => {
		if (!(data instanceof FormData)) {
			throw new Error("Invalid! FormData is required");
		}

		const year = data.get("year");
		const type = data.get("type");
		const slug = data.get("slug");
		const status = data.get("status");
		const returnTo = data.get("returnTo");

		if (!year || !type || !slug || !status) {
			throw new Error("Invalid request");
		}

		return {
			year: Number(year),
			type: type.toString(),
			slug: slug.toString(),
			status: status.toString(),
			returnTo: returnTo?.toString(),
		};
	})
	.handler(async (ctx) => {
		const { year, type, slug, status, returnTo } = ctx.data;
		const { user } = await getFullAuthSession();

		if (!user) {
			return new Response(null, {
				status: 303,
				headers: {
					Location: "/signin",
				},
			});
		}

		try {
			await upsertBookmark({ year, type, slug, status }, user.id);
		} catch (error) {
			console.error(error);
		}

		return new Response(null, {
			status: 303,
			headers: {
				Location: returnTo?.startsWith("/") ? returnTo : "/",
			},
		});
	});

export const updateBookmark = createServerFn({
	method: "POST",
})
	.inputValidator((data: { id: string; updates: Record<string, unknown> }) => data)
	.handler(async (ctx) => {
		const { id, updates } = ctx.data;

		const allowedFields = [
			"status",
			"priority",
			"last_notification_sent_at",
		] as const;
		const safeUpdates = Object.entries(updates ?? {}).reduce<
			Record<string, unknown>
		>((acc, [key, value]) => {
			if (allowedFields.includes(key as (typeof allowedFields)[number])) {
				acc[key] = value;
			}
			return acc;
		}, {});

		if (Object.keys(safeUpdates).length === 0) {
			return {
				success: false,
				error: "No valid bookmark fields to update",
			};
		}

		const { user } = await getFullAuthSession();

		if (!user) {
			return null;
		}

		const existingBookmark = await db.query.bookmark.findFirst({
			where: and(eq(bookmarkTable.id, id), eq(bookmarkTable.user_id, user.id)),
		});

		if (!existingBookmark) {
			return {
				success: false,
				statusCode: 404,
				error: "Bookmark not found",
			}
		}

		try {
			await db
				.update(bookmarkTable)
				.set(safeUpdates)
				.where(eq(bookmarkTable.id, id));

			return {
				success: true,
			};
		} catch (error) {
			console.error(error);
			return {
				success: false,
				error: "Failed to update bookmark",
			};
		}
	});

export const getUserBookmarks = createServerFn({
	method: "GET",
})
	.inputValidator((data: { year: number; userId: string }) => data)
	.handler(async (ctx) => {
		const { year, userId } = ctx.data;

		if (!userId) {
			throw new Error("User ID is required");
		}

		const rawUserId = String(userId);
		const normalizedUserId = rawUserId.trim().replace(/^@/, "");
		const normalizedUserIdLower = normalizedUserId.toLowerCase();

		const conditions = [
			eq(sql`lower(${userTable.github_username})`, normalizedUserIdLower),
			eq(sql`lower(${userTable.gitlab_username})`, normalizedUserIdLower),
			eq(sql`lower(${userTable.discord_username})`, normalizedUserIdLower),
			eq(sql`lower(${userTable.mastodon_username})`, normalizedUserIdLower),
			eq(sql`lower(${userTable.mastodon_acct})`, normalizedUserIdLower),
		];

		const user = await db.query.user.findFirst({
			where: or(...conditions),
		});

		if (!user) {
			throw new Error("User not found");
		}

		if (user.bookmarks_visibility === "private") {
			throw new Error("User has private bookmarks");
		}

		const bookmarks = await db
			.select()
			.from(bookmarkTable)
			.where(
				and(
					eq(bookmarkTable.user_id, user.id),
					eq(bookmarkTable.year, Number(year)),
				),
			);

		return bookmarks;
	});

export const deleteBookmark = createServerFn({
	method: "POST",
})
	.inputValidator((data: { id: string }) => data)
	.handler(async (ctx) => {
		const { id } = ctx.data;

		const { user } = await getFullAuthSession();

		if (!user) {
			return null;
		}

		const existingBookmark = await db.query.bookmark.findFirst({
			where: and(eq(bookmarkTable.id, id), eq(bookmarkTable.user_id, user.id)),
		});

		if (!existingBookmark) {
			return {
				success: false,
				statusCode: 404,
				error: "Bookmark not found",
			};
		}

		try {
			await db.delete(bookmarkTable).where(eq(bookmarkTable.id, id));

			return {
				success: true,
			};
		} catch (error) {
			console.error(error);
			return {
				success: false,
				error: "Failed to delete bookmark",
			};
		}
	});
