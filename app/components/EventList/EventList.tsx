import { useNavigate } from '@remix-run/react';
import clsx from 'clsx';

import { Button } from '~/components/ui/button';
import { FavouriteButton } from '~/components/FavouriteButton';
import { ShareButton } from '~/components/ShareButton';

type EventListItem = {
  id: string;
  title: string;
  startTime: string;
  duration: string;
  room: string;
  persons: string[];
  isFavourited?: boolean;
};

type EventListProps = {
  events: EventListItem[];
  favourites: {
    [key: string]: string;
  }[];
};

function EventListItem({
  event,
  index,
  isLast,
}: {
  event: EventListItem;
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
          {event.title}
        </h3>
        <p className="text-gray-500">
          {event.room} | {event.startTime} | {event.duration}
          {event.persons?.length > 0 && ` | ${event.persons.join(', ')}`}
        </p>
      </div>
      <div className="flex items-center pl-6 pr-3 gap-2">
        <FavouriteButton
          type="event"
          slug={event.id}
          status={event.isFavourited ? 'favourited' : 'unfavourited'}
        />
        <ShareButton
          title={event.title}
          text={`Check out ${event.title} at FOSDEM`}
          url={`https://fosdempwa.com/event/${event.id}`}
        />
        <Button
          variant="outline"
          onClick={() => navigate(`/event/${event.id}`)}
        >
          View
        </Button>
      </div>
    </div>
  );
}

export function EventList({ events, favourites }: EventListProps) {
  const eventsWithFavourites = events?.length
    ? events.map((event) => {
        return {
          ...event,
          isFavourited:
            (favourites?.length &&
              favourites.find((bookmark) => bookmark.slug === event.id)
                ?.status === 'favourited') ??
            false,
        };
      })
    : [];

  return (
    <ul className="event-list w-full">
      {eventsWithFavourites?.length > 0 ? (
        eventsWithFavourites.map((event, index) => (
          <li key={event.id}>
            <EventListItem
              event={event}
              index={index}
              isLast={events.length === index + 1}
            />
          </li>
        ))
      ) : (
        <li>
          <div className="flex justify-between">
            <div className="flex flex-col space-y-1.5 pt-6 pb-6">
              <h3 className="font-semibold leading-none tracking-tight">
                No events found
              </h3>
            </div>
          </div>
        </li>
      )}
    </ul>
  );
}
