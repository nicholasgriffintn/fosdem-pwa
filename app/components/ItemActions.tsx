import { Link } from "@tanstack/react-router";

import { Button } from "~/components/ui/button";
import { FavouriteButton } from "~/components/FavouriteButton";
import { ShareButton } from "~/components/ShareButton";
import { constants } from "~/constants";
import type { Event, Track } from "~/types/fosdem";
import type { User } from "~/server/db/schema";

type ItemWithFavorite = (Event | Track) & { isFavourited?: boolean };

type ItemActionsProps = {
  item: ItemWithFavorite;
  year: number;
  type: "event" | "track";
  bookmarksLoading: boolean;
  size?: "default" | "sm";
  className?: string;
  user?: User | null;
  onCreateBookmark?: ({
    type,
    slug,
    status,
  }: {
    type: string;
    slug: string;
    status: string;
  }) => void;
};

export function ItemActions({
  item,
  year,
  type,
  bookmarksLoading,
  size = "default",
  className = "",
  user,
  onCreateBookmark,
}: ItemActionsProps) {
  const isEvent = type === "event";
  const title = isEvent ? (item as Event).title : (item as Track).name;
  const slug = item.id;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {user?.id && onCreateBookmark && (
        <FavouriteButton
          year={year}
          type={type}
          slug={slug}
          status={
            bookmarksLoading
              ? "loading"
              : item.isFavourited
                ? "favourited"
                : "unfavourited"
          }
          user={user}
          onCreateBookmark={onCreateBookmark}
        />
      )}
      <ShareButton
        title={title}
        text={`Check out ${title} at FOSDEM`}
        url={`https://fosdempwa.com/${type}/${slug}`}
      />
      <Button
        variant="secondary"
        asChild
        size={size}
        className="w-full no-underline"
      >
        <Link
          to={`/${type}/$slug`}
          params={{ slug }}
          search={{ year: year || constants.DEFAULT_YEAR, day: undefined }}
        >
          View {isEvent ? "Event" : "Track"}
        </Link>
      </Button>
    </div>
  );
}
