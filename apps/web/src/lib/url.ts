export function buildSearchParams(search: {
	year?: number | undefined;
	type?: string | undefined;
	day?: string | null | undefined;
	test?: boolean | undefined;
	time?: string | undefined;
	track?: string | undefined;
	sortFavourites?: string | undefined;
	view?: string | undefined;
	q?: string | undefined;
}) {
	const params = Object.entries(search)
		.filter(([, value]) => value !== undefined && value !== null)
		.map(
			([key, value]) =>
				`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
		)
		.join("&");
	return params ? `?${params}` : "";
}

export function normalizeSiteUrl(site: string): string {
	try {
		const url = new URL(/^https?:\/\//i.test(site) ? site : `https://${site}`);
		return url.protocol === "https:" || url.protocol === "http:"
			? url.href
			: "#";
	} catch {
		return "#";
	}
}

export function resolveUrlTemplate(
	template: string,
	values: Record<string, string>,
): string {
	return template.replace(/\$\{([A-Z_]+)\}/g, (placeholder, key: string) => {
		const value = values[key];
		return value === undefined ? placeholder : encodeURIComponent(value);
	});
}
