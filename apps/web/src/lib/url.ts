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
