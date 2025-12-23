import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "~/components/shared/PageHeader";
import { Image } from "~/components/shared/Image";
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
				title: "Map | FOSDEM PWA",
				description: "Map of the ULB Solbosch Campus, the location of the FOSDEM event",
			}),
		],
	}),
	staleTime: 10_000,
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
					"Map of the ULB Solbosch Campus, the location of the FOSDEM event"
				}
				year={year}
			/>
			<div className="w-full">
				<Image
					src="/fosdem/images/map.png"
					alt="Map of the ULB Solbosch Campus, the location of the FOSDEM event"
					loading="eager"
					width={1200}
					height={800}
				/>
				<p className="text-sm text-muted-foreground mt-4">
					Get directions in{" "}
					<a href="https://www.openstreetmap.org/relation/13699100#map=17/50.812814/4.381442">
						OpenStreetMap
					</a>
					.
				</p>
			</div>
		</PageShell>
	);
}
