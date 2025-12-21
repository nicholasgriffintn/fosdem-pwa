import { createFileRoute } from "@tanstack/react-router";

import { constants } from "~/constants";
import { EventList } from "~/components/Event/EventList";
import { getAllData } from "~/server/functions/fosdem";
import type { Conference, Event, Person } from "~/types/fosdem";
import { PageHeader } from "~/components/PageHeader";
import { EmptyStateCard } from "~/components/EmptyStateCard";
import { useAuth } from "~/hooks/use-auth";
import { useMutateBookmark } from "~/hooks/use-mutate-bookmark";
import { getBookmarks } from "~/server/functions/bookmarks";

export const Route = createFileRoute("/speakers/$slug")({
    component: SpeakerPage,
    validateSearch: ({ year, day, sortFavourites }: { year: number; day?: string; sortFavourites?: string }) => ({
        year:
            (constants.AVAILABLE_YEARS.includes(year) && year) ||
            constants.DEFAULT_YEAR,
        day: day || undefined,
        sortFavourites: sortFavourites || undefined,
    }),
    loaderDeps: ({ search: { year, day, sortFavourites } }) => ({ year, day, sortFavourites }),
    loader: async ({ params, deps: { year } }) => {
        const data = (await getAllData({ data: { year } })) as Conference;

        const person = Object.values(data.persons || {}).find(
            (p) => p.slug === params.slug || p.id === params.slug,
        );

        let personEvents: Event[] = [];
        if (person) {
            personEvents = Object.values(data.events).filter((event: Event) =>
                event.personIds?.includes(person.id),
            );
        }

        const serverBookmarks = await getBookmarks({
            data: { year, status: "favourited" },
        });

        return {
            fosdem: { person, personEvents, conference: data.conference, days: Object.values(data.days) },
            year,
            serverBookmarks,
        };
    },
    head: ({ loaderData }) => ({
        meta: [
            {
                title: `${loaderData?.fosdem.person?.name} | Speakers | FOSDEM PWA`,
                description: `Speaker profile for ${loaderData?.fosdem.person?.name} at FOSDEM`,
            },
        ],
    }),
    staleTime: 10_000,
});

function SpeakerPage() {
    const { fosdem, year, serverBookmarks } = Route.useLoaderData();
    const { day, sortFavourites } = Route.useSearch();
    const navigate = Route.useNavigate();
    const { person, personEvents, days } = fosdem;
    const { user } = useAuth();
    const { create: createBookmark } = useMutateBookmark({ year });
    const onCreateBookmark = async (bookmark: any) => {
        await createBookmark(bookmark);
    };
    const handleSortFavouritesChange = (checked: boolean) => {
        navigate({
            search: (prev) => ({
                ...prev,
                sortFavourites: checked ? "true" : undefined,
            }),
        });
    };

    if (!person) {
        return (
            <div className="min-h-screen">
                <div className="relative py-6 lg:py-10">
                    <EmptyStateCard
                        title="Speaker not found"
                        description="We couldn't find this speaker profile."
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <div className="relative py-6 lg:py-10">
                <PageHeader
                    heading={person.name}
                    breadcrumbs={[{ title: "Speakers", href: "/speakers" }]}
                    year={year}
                />

                {person.biography && (
                    <div className="mt-8 prose prose-lg prose-indigo text-foreground">
                        <h2 className="text-2xl font-bold mb-4 text-foreground">Biography</h2>
                        <div
                            className="mt-2"
                            // biome-ignore lint/security/noDangerouslySetInnerHtml: Biography is HTML from FOSDEM
                            dangerouslySetInnerHTML={{
                                __html: person.extended_biography || person.biography,
                            }}
                        />
                    </div>
                )}

                <div className="mt-12 border-t pt-12">
                    <EventList
                        events={personEvents}
                        year={year}
                        title={`Sessions by ${person.name}`}
                        defaultViewMode="list"
                        displayViewMode={false}
                        groupByDay={true}
                        days={days}
                        day={day}
                        sortFavourites={sortFavourites}
                        onSortFavouritesChange={handleSortFavouritesChange}
                        user={user}
                        onCreateBookmark={onCreateBookmark}
                        displaySortByFavourites={true}
                        serverBookmarks={serverBookmarks}
                    />
                </div>
            </div>
        </div>
    );
}
