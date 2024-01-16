import { useNavigate } from '@remix-run/react';
import clsx from 'clsx';

import { Button } from '~/components/ui/button';
import { Icons } from '~/components/Icons';
import { toast } from '~/components/ui/use-toast';
import { FavouriteButton } from '~/components/FavouriteButton';

type TrackListItem = {
  id: string;
  name: string;
  room: string;
  eventCount: number;
  isFavourited?: boolean;
};

type TrackListProps = {
  tracks: TrackListItem[];
  favourites: {
    [key: string]: string;
  }[];
};

function TrackListItem({
  track,
  index,
  isLast,
}: {
  track: TrackListItem;
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
          {track.name}
        </h3>
        <p className="text-gray-500">
          {track.room} | {track.eventCount} events
        </p>
      </div>
      <div className="flex items-center pl-6 pr-3 gap-2">
        <FavouriteButton
          type="track"
          slug={track.id}
          status={track.isFavourited ? 'favourited' : 'unfavourited'}
        />
        <Button
          variant="ghost"
          onClick={() =>
            toast({
              title: 'Not implemented',
              description: "We're still working on sharing items.",
            })
          }
        >
          <Icons.share />
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate(`/track/${track.id}`)}
        >
          View
        </Button>
      </div>
    </div>
  );
}

export function TrackList({ tracks, favourites }: TrackListProps) {
  const tracksWithFavourites = tracks?.length
    ? tracks.map((track) => {
        return {
          ...track,
          isFavourited:
            (favourites?.length &&
              favourites.find((bookmark) => bookmark.slug === track.id)
                ?.status === 'favourited') ??
            false,
        };
      })
    : [];

  return (
    <ul className="track-list w-full rounded-md">
      {tracksWithFavourites?.length > 0 ? (
        tracksWithFavourites.map((track, index) => (
          <li key={track.id}>
            <TrackListItem
              track={track}
              index={index}
              isLast={tracks.length === index + 1}
            />
          </li>
        ))
      ) : (
        <li>
          <div className="flex justify-between">
            <div className="flex flex-col space-y-1.5 pt-6 pb-6">
              <h3 className="font-semibold leading-none tracking-tight">
                No tracks found
              </h3>
            </div>
          </div>
        </li>
      )}
    </ul>
  );
}
