export type FosdemOAuthProvider = "discord" | "github" | "gitlab" | "mastodon";

export function isFosdemOAuthProvider(
	value: string,
): value is FosdemOAuthProvider {
	return (
		value === "discord" ||
		value === "github" ||
		value === "gitlab" ||
		value === "mastodon"
	);
}
