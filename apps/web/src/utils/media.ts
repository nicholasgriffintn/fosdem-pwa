export function isHlsType(type?: string): boolean {
	return (
		type === "application/vnd.apple.mpegurl" || type === "application/x-mpegURL"
	);
}
