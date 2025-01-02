import clsx from 'clsx';
import { Link } from '@tanstack/react-router';

import { Button } from '~/components/ui/button';
import { FavouriteButton } from '~/components/FavouriteButton';
import { ShareButton } from '~/components/ShareButton';

type TrackListItem = {
  id: string;
  name: string;
  room: string;
  eventCount: number;
  isFavourited?: boolean;
};

type TrackListProps = {
  tracks: TrackListItem[];
  favourites?: {
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
  const className = clsx('flex justify-between', {
    'border-t-2 border-solid border-muted': index % 2 === 1,
    'border-b-2': index % 2 === 1 && !isLast,
  });

  return (
    <div className={className}>
      <div className="flex flex-col md:flex-row md:justify-between w-full">
        <div className="flex flex-col space-y-1.5 pt-3 pb-3 pl-1 pr-1">
          <h3 className="font-semibold leading-none tracking-tight">
            {track.name}
          </h3>
          <p className="text-gray-500">
            {track.room} | {track.eventCount} events
          </p>
        </div>
        <div className="flex items-center pl-1 pr-1 md:pl-6 md:pr-3 gap-2 pb-3 md:pb-0">
          <FavouriteButton
            type="track"
            slug={track.id}
            status={track.isFavourited ? 'favourited' : 'unfavourited'}
          />
          <ShareButton
            title={track.name}
            text={`Check out ${track.name} at FOSDEM`}
            url={`https://fosdempwa.com/track/${track.id}`}
          />
          <Button variant="secondary" asChild className="w-full">
            <Link to={`/track/${track.id}`}>View Track</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function TrackList({ tracks, favourites }: TrackListProps) {
  const tracksWithFavourites = tracks?.length
    ? tracks.map((track) => {
      return {
        ...track,
        isFavourited: favourites?.length
          ? Boolean(favourites.find((bookmark) => bookmark.slug === track.id)?.status === 'favourited')
          : undefined,
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