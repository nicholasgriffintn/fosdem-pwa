export function getImageDimensions(size: string) {
	if (size === "full") return { width: 1920, height: 1080 };
	if (size === "featured") return { width: 400, height: 225 };
	return { width: 800, height: 600 };
}
