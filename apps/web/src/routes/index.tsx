import { createFileRoute } from "@tanstack/react-router";

import { TypesList } from "~/components/Type/TypesList";
import { getAllData } from "~/server/functions/fosdem";
import { PageHeader } from "~/components/PageHeader";
import { ConferenceScheduleNotice } from "~/components/ConferenceScheduleNotice";
import { constants } from "~/constants";
import { EmptyStateCard } from "~/components/EmptyStateCard";

export const Route = createFileRoute("/")({
	component: Home,
	validateSearch: ({ year }: { year: number }) => ({
		year:
			(constants.AVAILABLE_YEARS.includes(year) && year) ||
			constants.DEFAULT_YEAR,
	}),
	loaderDeps: ({ search: { year } }) => ({ year }),
	loader: async ({ deps: { year } }) => {
		const data = await getAllData({ data: { year } });
		return {
			fosdem: {
				conference: data.conference,
				types: data.types,
			},
		};
	},
	staleTime: 10_000,
});

function Home() {
	const { fosdem } = Route.useLoaderData();
	const { year } = Route.useSearch();

	if (!fosdem) {
		return <div>Loading...</div>;
	}

	return (
		<div className="min-h-screen">
			<div className="relative py-6 lg:py-10">
				<PageHeader
					heading={fosdem.conference.title}
					text={`${fosdem.conference.city} / ${fosdem.conference.start} - ${fosdem.conference.end}`}
					year={year}
				/>

				{!fosdem.types || Object.keys(fosdem.types).length === 0 ? (
					<EmptyStateCard
						title="No schedule data yet"
						description="We couldn't load tracks and types for this year. Please check back shortly."
					/>
				) : (
					<>
							<ConferenceScheduleNotice conference={fosdem.conference} year={year} />

							<div>{fosdem.types && <TypesList types={fosdem.types} />}</div>
					</>
				)}
			</div>
		</div>
	);
}
