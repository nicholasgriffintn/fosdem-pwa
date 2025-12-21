import { createFileRoute } from "@tanstack/react-router";

import { getAllData } from "~/server/functions/fosdem";
import type { Conference } from "~/types/fosdem";
import { constants } from "~/constants";
import { PageHeader } from "~/components/PageHeader";
import { SpeakerList } from "~/components/Speaker/SpeakerList";

export const Route = createFileRoute("/speakers/")({
    component: SpeakersPage,
    validateSearch: ({ year, q }: { year: number; q?: string }) => ({
        year:
            (constants.AVAILABLE_YEARS.includes(year) && year) ||
            constants.DEFAULT_YEAR,
        q: q || "",
    }),
    loaderDeps: ({ search: { year, q } }) => ({ year, q }),
    loader: async ({ deps: { year, q } }) => {
        const data = (await getAllData({ data: { year } })) as Conference;
        const persons = Object.values(data.persons ?? {});
        const normalizedQuery = (q || "").toLowerCase().trim();
        const filteredPersons = normalizedQuery
            ? persons.filter((person) =>
                person.name.toLowerCase().includes(normalizedQuery),
            )
            : persons;

        return { persons: filteredPersons, year, query: q || "" };
    },
    head: () => ({
        meta: [
            {
                title: "Speakers | FOSDEM PWA",
                description: "All speakers at FOSDEM",
            },
        ],
    }),
    staleTime: 10_000,
});

function SpeakersPage() {
    const { persons, year, query } = Route.useLoaderData();

    return (
        <div className="min-h-screen">
            <div className="relative py-6 lg:py-10">
                <PageHeader
                    heading="Speakers"
                    subtitle={`There are ${persons.length} speakers at this year's FOSDEM!`}
                    year={year}
                />
                <div className="mt-6">
                    <SpeakerList persons={persons} year={year} initialQuery={query} />
                </div>
            </div>
        </div>
    );
}
