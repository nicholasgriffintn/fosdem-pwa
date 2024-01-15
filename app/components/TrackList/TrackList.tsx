import { useNavigate } from '@remix-run/react';
import clsx from 'clsx';

import { Button } from '~/components/ui/button';

type TrackListItem = {
  id: string;
  name: string;
  room: string;
  eventCount: number;
};

type TrackListProps = {
  tracks: TrackListItem[];
};

function TrackListItem({
  track,
  index,
}: {
  track: TrackListItem;
  index: number;
}) {
  const navigate = useNavigate();

  const className = clsx('flex justify-between', {
    'border-t-2 border-b-2 border-solid border-muted': index % 2 === 1,
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
      <div className="flex items-center pl-6 pr-3">
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

export function TrackList({ tracks }: TrackListProps) {
  return (
    <ul className="track-list w-full rounded-md">
      {tracks?.length > 0 ? (
        tracks.map((track, index) => (
          <li key={track.id}>
            <TrackListItem track={track} index={index} />
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
