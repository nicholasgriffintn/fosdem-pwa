import { Link } from "@tanstack/react-router";
import type { Event, Person } from "~/types/fosdem";

type EventSpeakersProps = {
  event: Event;
  year: number;
  persons?: Record<string, Person>;
};

export function EventSpeakers({ event, year, persons }: EventSpeakersProps) {
  if (!event.persons || event.persons.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-foreground mb-4">Speakers</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {event.persons.map((personName, index) => {
          const personId = event.personIds?.[index];
          const person =
            personId && persons?.[personId]
              ? persons[personId]
              : Object.values(persons || {}).find((p) => p.name === personName);

          const content = (
            <div className="flex items-start gap-4 p-4 rounded-lg border bg-card/40 backdrop-blur-sm transition-colors hover:border-primary/50">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-foreground mb-1 truncate">
                  {personName}
                </div>
                {person && (person.biography || person.extended_biography) && (
                  <div
                    className="text-sm text-muted-foreground line-clamp-3 prose-sm prose-indigo"
                    suppressHydrationWarning
                    dangerouslySetInnerHTML={{
                      __html: person.biography || person.extended_biography || "",
                    }}
                  />
                )}
              </div>
            </div>
          );

          if (person) {
            return (
              <Link
                key={person.id || index}
                to="/speakers/$slug"
                params={{ slug: person.slug || person.id }}
                search={{ year, day: undefined, sortFavourites: undefined }}
                className="no-underline"
              >
                {content}
              </Link>
            );
          }

          return <div key={index}>{content}</div>;
        })}
      </div>
    </div>
  );
}
