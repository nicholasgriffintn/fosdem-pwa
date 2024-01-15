import { useNavigate } from '@remix-run/react';
import clsx from 'clsx';

import { Button } from '~/components/ui/button';
import { Icons } from '~/components/Icons';
import { toast } from '~/components/ui/use-toast';

type EventListItem = {
  id: string;
  title: string;
  startTime: string;
  duration: string;
  room: string;
  persons: string[];
};

type EventListProps = {
  events: EventListItem[];
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
        <Button
          variant="ghost"
          onClick={() =>
            toast({
              title: 'Not implemented',
              description: "We're still working on favoriting items.",
            })
          }
        >
          <Icons.star />
        </Button>
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
          onClick={() => navigate(`/event/${event.id}`)}
        >
          View
        </Button>
      </div>
    </div>
  );
}

export function EventList({ events }: EventListProps) {
  return (
    <ul className="event-list w-full">
      {events?.length > 0 ? (
        events.map((event, index) => (
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
