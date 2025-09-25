import { createFileRoute } from "@tanstack/react-router";

import { TypesList } from "~/components/Type/TypesList";
import { getAllData } from "~/server/functions/fosdem";
import { PageHeader } from "~/components/PageHeader";
import { constants } from "~/constants";

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
				<div>{fosdem.types && <TypesList types={fosdem.types} />}</div>
			</div>
		</div>
	);
}
