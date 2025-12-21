import { Label } from "~/components/ui/label";

export function SortFavouritesSwitch({
  sortSwitchId,
  sortByFavourites = false,
  onToggle,
}: {
  sortSwitchId: string;
  sortByFavourites?: boolean;
    onToggle?: (checked: boolean) => void;
  }) {
  return (
    <div className="flex items-center gap-2 leading-none">
      <input
        type="checkbox"
        id={sortSwitchId}
        checked={sortByFavourites}
        onChange={(e) => {
          onToggle?.(e.target.checked);
        }}
        className="sr-only peer/sort"
      />
      <label
        htmlFor={sortSwitchId}
        className="cursor-pointer relative inline-flex h-6 w-11 items-center rounded-full bg-input align-middle transition-colors peer-checked/sort:bg-primary after:content-[''] after:absolute after:left-0.5 after:top-1/2 after:-translate-y-1/2 after:h-4 after:w-4 after:rounded-full after:bg-background after:transition peer-checked/sort:after:translate-x-5"
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
