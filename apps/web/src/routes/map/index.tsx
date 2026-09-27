import { brand, conferenceConfig } from "@roomisfull/conference";
import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "~/components/shared/PageHeader";
import { ConferenceMap } from "~/components/Room/ConferenceMap";
import { constants } from "~/constants";
import { generateCommonSEOTags } from "~/utils/seo-generator";
import { PageShell } from "~/components/shared/PageShell";

export const Route = createFileRoute("/map/")({
	component: MapPage,
	validateSearch: ({ year }: { year: number }) => ({
		year:
			(constants.AVAILABLE_YEARS.includes(year) && year) ||
			constants.DEFAULT_YEAR,
	}),
	head: () => ({
		meta: [
			...generateCommonSEOTags({
				title: `Map | ${brand.name}`,
				description:
					conferenceConfig.map?.description ||
					`Venue information for ${conferenceConfig.name}`,
			}),
		],
	}),
	staleTime: 1000 * 60 * 5, // 5 minutes
});

function MapPage() {
	const { year } = Route.useSearch();
	return <MapPageView year={year} />;
}

export function MapPageView({ year }: { year: number }) {
	return (
		<PageShell>
			<PageHeader
				heading="Map"
				text={
					conferenceConfig.map?.description ||
					`Venue information for ${conferenceConfig.name}`
				}
				year={year}
			/>
			<ConferenceMap />
		</PageShell>
	);
}
