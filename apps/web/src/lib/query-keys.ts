"use client";

export const dataQueryKeys = {
	fosdem: (year: number) => ["fosdem-data", year],
};

export const sessionQueryKeys = {
	auth: ["auth"],
	profile: (userId: number | string) => ["profile", userId],
	userStats: ["user-stats"],
	userStatsHisotry: ["user-stats-history"],
};

export const bookmarkQueryKeys = {
	local: (year: number) => ["local-bookmarks", year],
	list: (
		year: number,
		userId: number | string | null | undefined,
	) => ["bookmarks", year, userId ?? null],
	item: (year: number, slug: string) => ["bookmarks", year, slug],
	userBookmarks: (userId: string, year?: number) => ["userBookmarks", userId, year ?? null],
};

export const notesQueryKeys = {
	localItem: (year: number, slug: string) => ["local-notes", year, slug],
};

export const subscriptionQueryKeys = {
	list: ["subscriptions"],
};

export const roomStatusQueryKeys = {
	status: (roomId: string) => ["room-status", roomId],
	statuses: (roomNames: string[]) => ["room-statuses", ...roomNames],
	history: (roomId: string, limit: number) => ["room-status-history", roomId, limit],
};
