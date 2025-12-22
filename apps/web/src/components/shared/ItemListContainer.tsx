"use client";

import { useId } from "react";

import { EmptyStateCard } from "~/components/EmptyStateCard";
import { DaySwitcher } from "~/components/DaySwitcher";
import { SortFavouritesSwitch } from "~/components/SortFavouritesSwitch";

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
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
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
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
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
              className="my-4"
            />
          )}
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
        {title && (
          <h2 className="text-xl font-semibold shrink-0 text-foreground">
            {title}
          </h2>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
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
          className="my-4"
        />
      )}
    </section>
  );
}
