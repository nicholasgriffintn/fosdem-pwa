export function serialiseJsonForHtml(value: unknown): string {
	return JSON.stringify(value).replace(/</g, "\\u003c");
}
