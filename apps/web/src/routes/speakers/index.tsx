import { createFileRoute } from "@tanstack/react-router";

import { getAllData } from "~/server/functions/fosdem";
import type { Conference } from "~/types/fosdem";
import { constants } from "~/constants";
import { PageHeader } from "~/components/PageHeader";
import { SpeakerList } from "~/components/Speaker/SpeakerList";

export const Route = createFileRoute("/speakers/")({
    component: SpeakersPage,
    validateSearch: ({ year }: { year: number }) => ({
        year:
            (constants.AVAILABLE_YEARS.includes(year) && year) ||
            constants.DEFAULT_YEAR,
    }),
    loaderDeps: ({ search: { year } }) => ({ year }),
    loader: async ({ deps: { year } }) => {
        const data = (await getAllData({ data: { year } })) as Conference;
        return { fosdem: { persons: data.persons }, year };
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
    const { fosdem, year } = Route.useLoaderData();
    const persons = fosdem.persons ? Object.values(fosdem.persons) : [];

    return (
        <div className="min-h-screen">
            <div className="relative py-6 lg:py-10">
                <PageHeader heading="Speakers" subtitle={`There are ${persons.length} speakers at this year's FOSDEM!`} year={year} />
                <div className="mt-6">
                    <SpeakerList persons={persons} year={year} />
                </div>
            </div>
        </div>
    );
}
