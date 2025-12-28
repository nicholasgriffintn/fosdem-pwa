import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";
import { useUserSettings } from "~/hooks/use-user-settings";

type SetBookmarksVisabilityProps = {
	userId: string;
	bookmarksVisibility: string;
};

export function SetBookmarksVisability({
	userId,
	bookmarksVisibility,
}: SetBookmarksVisabilityProps) {
	const { setBookmarksVisibility } = useUserSettings({ userId });

	const handleVisibilityChange = (checked: boolean) => {
		setBookmarksVisibility({ visibility: checked ? "public" : "private" });
	};

	return (
		<div className="flex items-center justify-between py-4">
			<div className="space-y-0.5">
				<Label htmlFor="bookmarks-visibility">Profile Visibility</Label>
				<p className="text-sm text-muted-foreground">
					Make your profile and bookmarks visible to other users
				</p>
			</div>
			{/** biome-ignore lint/correctness/useUniqueElementIds: it's wrong */}
			<Switch
				id="bookmarks-visibility"
				checked={bookmarksVisibility === "public"}
				onCheckedChange={handleVisibilityChange}
			/>
		</div>
	);
}
