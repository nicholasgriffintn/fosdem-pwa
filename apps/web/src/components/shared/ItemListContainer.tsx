"use client";

import { useId } from "react";

import { EmptyStateCard } from "~/components/shared/EmptyStateCard";
import { DaySwitcher } from "~/components/shared/DaySwitcher";
import { SortFavouritesSwitch } from "~/components/shared/SortFavouritesSwitch";

export interface ItemListContainerProps<T> {
  items: T[];
  title?: string;
  groupByDay?: boolean;
  days?: Array<{ id: string; name: string }>;
  currentDay?: string;
  getDayId?: (item: T) => string | number | string[] | number[];
  groupItemsByDay?: (items: T[]) => Record<string, T[]>;
  displaySortByFavourites?: boolean;
  sortByFavourites?: boolean;
  onSortChange?: (checked: boolean) => void;
  renderViewModeSwitch?: () => React.ReactNode;
  emptyStateTitle?: string;
  emptyStateMessage?: string;
  renderItem?: (item: T) => React.ReactNode;
  renderList?: (items: T[], props: { sortByFavourites?: boolean }) => React.ReactNode;
  [key: string]: unknown;
}

export function ItemListContainer<T>({
  items,
  title,
  groupByDay = false,
  days,
  currentDay,
  getDayId,
  groupItemsByDay,
  displaySortByFavourites = false,
  sortByFavourites = false,
  onSortChange,
  renderViewModeSwitch,
  emptyStateTitle = "No items to show",
  emptyStateMessage = "Adjust filters or pick another day to see more items.",
  renderItem,
  renderList,
  ...restProps
}: ItemListContainerProps<T>) {
  const sortSwitchId = useId();

  if (!items.length) {
    return (
      <div className="my-6">
        {title && (
          <h2 className="text-xl font-semibold shrink-0">{title}</h2>
        )}
        <EmptyStateCard
          title={emptyStateTitle}
          description={emptyStateMessage}
          className="my-6"
        />
      </div>
    );
  }

  if (groupByDay && days && groupItemsByDay && getDayId) {
    const itemsSplitByDay = groupItemsByDay(items);
    const dayId = currentDay || days[0]?.id;

    return (
      <section>
        <div className="flex flex-col space-y-4">
          <div className="sticky top-16 z-10 -mx-4 px-4 py-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b md:static md:z-auto md:mx-0 md:px-0 md:py-0 md:bg-transparent md:backdrop-blur-none md:border-0">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-3">
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                {title && (
                  <h2 className="text-xl font-semibold shrink-0">{title}</h2>
                )}
                <div className="flex gap-2 justify-start flex-wrap">
                  <DaySwitcher
                    days={days}
                    dayId={dayId}
                    datSplitByDay={itemsSplitByDay}
                  />
                </div>
              </div>
              <div className="flex flex-row flex-wrap items-center justify-start md:justify-end gap-3 shrink-0">
                {displaySortByFavourites && (
                  <SortFavouritesSwitch
                    sortSwitchId={sortSwitchId}
                    sortByFavourites={sortByFavourites}
                    onToggle={onSortChange}
                  />
                )}
                {renderViewModeSwitch?.()}
              </div>
            </div>
          </div>
          {typeof dayId === "string" && itemsSplitByDay[dayId] ? (
            <div>
              {renderList
                ? renderList(itemsSplitByDay[dayId], { sortByFavourites })
                : itemsSplitByDay[dayId].map((item, index) => (
                  <div key={String(getDayId?.(item) || index)}>
                    {renderItem?.(item)}
                  </div>
                ))
              }
            </div>
          ) : (
            <EmptyStateCard
              title="No items for this day"
              description="Try switching to another day or come back later for updates."
                className="my-6"
            />
          )}
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="sticky top-16 z-10 -mx-4 px-4 py-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b md:static md:z-auto md:mx-0 md:px-0 md:py-0 md:bg-transparent md:backdrop-blur-none md:border-0">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-3">
          {title && (
            <h2 className="text-xl font-semibold shrink-0 text-foreground">
              {title}
            </h2>
          )}
          <div className="flex flex-row flex-wrap items-center justify-start md:justify-end gap-3 shrink-0">
            {displaySortByFavourites && (
              <SortFavouritesSwitch
                sortSwitchId={sortSwitchId}
                sortByFavourites={sortByFavourites}
                onToggle={onSortChange}
              />
            )}
            {renderViewModeSwitch?.()}
          </div>
        </div>
      </div>
      {items.length > 0 ? (
        renderList
          ? renderList(items, { sortByFavourites, ...restProps })
          : items.map((item, index) => (
            <div key={String(getDayId?.(item) || index)}>
              {renderItem?.(item)}
            </div>
          ))
      ) : (
        <EmptyStateCard
          title="No items found"
          description="Adjust filters or pick another day to see more items."
            className="my-6"
        />
      )}
    </section>
  );
}
