import { useNavigate } from '@remix-run/react';
import clsx from 'clsx';

import { Button } from '~/components/ui/button';
import { FavouriteButton } from '~/components/FavouriteButton';

type BookmarksListItem = {
  id: number;
  type: 'track' | 'event';
  slug: string;
  status: 'favourited' | 'unfavourited';
};

type BookmarksListProps = {
  bookmarks: BookmarksListItem[];
};

function BookmarksListItem({
  bookmark,
  index,
  isLast,
}: {
  bookmark: BookmarksListItem;
  index: number;
  isLast: boolean;
}) {
  const navigate = useNavigate();

  const className = clsx('flex justify-between', {
    'border-t-2 border-solid border-muted': index % 2 === 1,
    'border-b-2': index % 2 === 1 && !isLast,
  });

  return (
    <div className={className}>
      <div className="flex flex-col space-y-1.5 pt-3 pb-3 pl-1 pr-1">
        <h3 className="font-semibold leading-none tracking-tight">
          {bookmark.slug}
        </h3>
      </div>
      <div className="flex items-center pl-6 pr-3 gap-2">
        <FavouriteButton
          type="track"
          slug={bookmark.slug}
          status={bookmark.status}
        />
        <Button
          variant="outline"
          onClick={() => navigate(`/${bookmark.type}/${bookmark.slug}`)}
        >
          View
        </Button>
      </div>
    </div>
  );
}

export function BookmarksList({ bookmarks }: BookmarksListProps) {
  return (
    <ul className="track-list w-full rounded-md">
      {bookmarks?.length > 0 ? (
        bookmarks.map((bookmark, index) => (
          <li key={bookmark.id}>
            <BookmarksListItem
              bookmark={bookmark}
              index={index}
              isLast={bookmarks.length === index + 1}
            />
          </li>
        ))
      ) : (
        <li>
          <div className="flex justify-between">
            <div className="flex flex-col space-y-1.5 pt-6 pb-6">
              <h3 className="font-semibold leading-none tracking-tight">
                No bookmarks found
              </h3>
            </div>
          </div>
        </li>
      )}
    </ul>
  );
}
