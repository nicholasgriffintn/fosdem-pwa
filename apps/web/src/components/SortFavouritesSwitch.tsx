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
        className="cursor-pointer relative inline-flex h-6 w-11 items-center rounded-full bg-input transition-colors peer-checked/sort:bg-primary after:content-[''] after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-background after:transition peer-checked/sort:after:translate-x-5"
      >
        <span className="sr-only">Toggle favourites-first sorting</span>
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
