import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";
import { useUserSettings } from "~/hooks/use-user-settings";

export function SetBookmarksVisability({
	year,
	userId,
	bookmarksVisibility,
}: {
	year: number;
	userId: string;
	bookmarksVisibility: string;
}) {
	const { setBookmarksVisibility } = useUserSettings({ userId });

	const handleVisibilityChange = (checked: boolean) => {
		setBookmarksVisibility({ visibility: checked ? "public" : "private" });
	};

	return (
		<div className="flex items-center justify-between py-4">
			<div className="space-y-0.5">
				<Label htmlFor="bookmarks-visibility">Bookmarks Visibility</Label>
				<p className="text-sm text-muted-foreground">
					Make your bookmarks visible to other users
				</p>
			</div>
			<Switch
				id="bookmarks-visibility"
				checked={bookmarksVisibility === "public"}
				onCheckedChange={handleVisibilityChange}
			/>
		</div>
	);
}
