import { useNavigate } from "@tanstack/react-router";

import { Label } from "~/components/ui/label";

export function SortFavouritesSwitch({
  sortSwitchId,
  sortByFavourites = false,
}: {
  sortSwitchId: string;
  sortByFavourites?: boolean;
}) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        id={sortSwitchId}
        checked={sortByFavourites}
        onChange={(e) => {
          navigate({
            search: (prev) => ({
              ...prev,
              sortFavourites: e.target.checked ? 'true' : undefined
            })
          });
        }}
        className="sr-only peer/sort"
      />
      <label
        htmlFor={sortSwitchId}
        className="cursor-pointer relative inline-flex h-6 w-11 items-center rounded-full bg-input peer-checked/sort:bg-primary transition-colors"
      >
        <span className="sr-only">Toggle favourites-first sorting</span>
        <span className="inline-block h-4 w-4 ml-0.5 transform rounded-full bg-background transition peer-checked/sort:translate-x-5" />
      </label>
      <Label
        htmlFor={sortSwitchId}
        className="text-sm font-medium text-foreground cursor-pointer"
      >
        Favourites first
      </Label>
    </div>
  )
}