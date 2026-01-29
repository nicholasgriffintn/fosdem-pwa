export function generateBookmarkId(
	userId: number,
	year: number,
	slug: string,
): string {
	return `${userId}_${year}_${slug}`;
}
