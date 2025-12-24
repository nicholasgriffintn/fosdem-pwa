import { createServerFn } from "@tanstack/react-start";

import { getAuthUser } from "~/server/lib/auth-middleware";
import { validateYear } from "~/server/lib/bookmark-utils";
import { ok, err, type Result } from "~/server/lib/result";
import {
	findBookmarksByUserAndStatus,
	findBookmarksByUserAndYear,
	findBookmark,
	findBookmarkById,
	upsertBookmark,
	updateBookmark as updateBookmarkRepo,
	deleteBookmark as deleteBookmarkRepo,
} from "~/server/repositories/bookmark-repository";
import { findUserByUsername } from "~/server/repositories/user-repository";
import type { Bookmark } from "~/server/db/schema";

export const getBookmarks = createServerFn({
	method: "GET",
})
	.inputValidator((data: { year: number; status: "favourited" | "unfavourited" }) => data)
	.handler(async (ctx): Promise<Bookmark[]> => {
		const { year, status } = ctx.data;
		const yearNum = validateYear(year);

		const user = await getAuthUser();
		if (!user) {
			return [];
		}

		return findBookmarksByUserAndStatus(user.id, yearNum, status);
	});

export const getEventBookmark = createServerFn({
	method: "GET",
})
	.inputValidator((data: { year: number; slug: string }) => data)
	.handler(async (ctx): Promise<Bookmark | null> => {
		const { year, slug } = ctx.data;
		const yearNum = validateYear(year);

		const user = await getAuthUser();
		if (!user) {
			return null;
		}

		const bookmark = await findBookmark(user.id, yearNum, slug);
		return bookmark ?? null;
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
		}) => data
	)
	.handler(async (ctx): Promise<Result<boolean> | Response | null> => {
		const { year, type, slug, status, returnTo } = ctx.data;

		if (!type || !slug || !status) {
			throw new Error("Invalid request");
		}

		const user = await getAuthUser();
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
			const yearNum = validateYear(year);
			await upsertBookmark(user.id, yearNum, type, slug, status);

			if (returnTo) {
				return new Response(null, {
					status: 303,
					headers: {
						Location: returnTo.startsWith("/") ? returnTo : "/",
					},
				});
			}

			return ok(true);
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

			return err("Failed to save bookmark");
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
	.handler(async (ctx): Promise<Response> => {
		const { year, type, slug, status, returnTo } = ctx.data;
		const user = await getAuthUser();

		if (!user) {
			return new Response(null, {
				status: 303,
				headers: {
					Location: "/signin",
				},
			});
		}

		try {
			const yearNum = validateYear(year);
			await upsertBookmark(user.id, yearNum, type, slug, status);
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
	.handler(async (ctx): Promise<Result<boolean> | null> => {
		const { id, updates } = ctx.data;

		const allowedFields = ["status", "priority", "last_notification_sent_at"] as const;
		type AllowedField = (typeof allowedFields)[number];
		const safeUpdates: Partial<Pick<Bookmark, AllowedField>> = {};

		for (const [key, value] of Object.entries(updates ?? {})) {
			if (allowedFields.includes(key as AllowedField)) {
				(safeUpdates as Record<string, unknown>)[key] = value;
			}
		}

		if (Object.keys(safeUpdates).length === 0) {
			return err("No valid bookmark fields to update");
		}

		const user = await getAuthUser();
		if (!user) {
			return null;
		}

		const existingBookmark = await findBookmarkById(id, user.id);
		if (!existingBookmark) {
			return err("Bookmark not found", 404);
		}

		try {
			await updateBookmarkRepo(id, safeUpdates);
			return ok(true);
		} catch (error) {
			console.error(error);
			return err("Failed to update bookmark");
		}
	});

export const getUserBookmarks = createServerFn({
	method: "GET",
})
	.inputValidator((data: { year: number; userId: string }) => data)
	.handler(async (ctx): Promise<Bookmark[]> => {
		const { year, userId } = ctx.data;

		if (!userId) {
			throw new Error("User ID is required");
		}

		const user = await findUserByUsername(userId);
		if (!user) {
			throw new Error("User not found");
		}

		if (user.bookmarks_visibility === "private") {
			throw new Error("User has private bookmarks");
		}

		return findBookmarksByUserAndYear(user.id, Number(year));
	});

export const deleteBookmark = createServerFn({
	method: "POST",
})
	.inputValidator((data: { id: string }) => data)
	.handler(async (ctx): Promise<Result<boolean> | null> => {
		const { id } = ctx.data;

		const user = await getAuthUser();
		if (!user) {
			return null;
		}

		const existingBookmark = await findBookmarkById(id, user.id);
		if (!existingBookmark) {
			return err("Bookmark not found", 404);
		}

		try {
			await deleteBookmarkRepo(id);
			return ok(true);
		} catch (error) {
			console.error(error);
			return err("Failed to delete bookmark");
		}
	});
