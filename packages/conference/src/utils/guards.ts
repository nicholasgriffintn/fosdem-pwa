export function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isStringArray(value: unknown): value is string[] {
	return (
		Array.isArray(value) && value.every((item) => typeof item === "string")
	);
}

export function isRecordOf<T>(
	value: unknown,
	guard: (item: unknown) => item is T,
): value is Record<string, T> {
	return isRecord(value) && Object.values(value).every(guard);
}

export function hasOptionalStrings(
	value: Record<string, unknown>,
	keys: string[],
): boolean {
	return keys.every(
		(key) => value[key] === undefined || typeof value[key] === "string",
	);
}

export function isWebUrl(value: unknown): value is string {
	if (typeof value !== "string") return false;
	try {
		const url = new URL(value);
		return (
			["https:", "http:"].includes(url.protocol) &&
			!url.username &&
			!url.password
		);
	} catch {
		return false;
	}
}
