import { createFileRoute } from "@tanstack/react-router";

import { getAllData } from "~/server/functions/fosdem";
import type { Conference } from "~/types/fosdem";
import { constants } from "~/constants";
import { PageHeader } from "~/components/shared/PageHeader";
import { SpeakerList } from "~/components/Speaker/SpeakerList";
import { generateCommonSEOTags } from "~/utils/seo-generator";
import { PageShell } from "~/components/shared/PageShell";

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
            ...generateCommonSEOTags({
                title: "Speakers | FOSDEM PWA",
                description: "All speakers at FOSDEM",
            })
        ],
    }),
    staleTime: 1000 * 60 * 5, // 5 minutes
});

function SpeakersPage() {
    const { persons, year, query } = Route.useLoaderData();

    return (
        <PageShell>
                <PageHeader
                    heading="Speakers"
                    subtitle={`There are ${persons.length} speakers at this year's FOSDEM!`}
                    year={year}
            />
            <SpeakerList persons={persons} year={year} initialQuery={query} />
        </PageShell>
    );
}
