import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "~/components/PageHeader";
import { Image } from "~/components/Image";
import { constants } from "~/constants";

export const Route = createFileRoute("/map/")({
	component: MapPage,
	validateSearch: ({ year }: { year: number }) => ({
		year:
			(constants.AVAILABLE_YEARS.includes(year) && year) ||
			constants.DEFAULT_YEAR,
	}),
	head: () => ({
		meta: [
			{
				title: "Map | FOSDEM PWA",
				description:
					"Map of the ULB Solbosch Campus, the location of the FOSDEM event",
			},
		],
	}),
	staleTime: 10_000,
});

function MapPage() {
	const { year } = Route.useSearch();

	return (
		<div className="min-h-screen">
			<div className="relative py-6 lg:py-10">
				<PageHeader
					heading="Map"
					text={
						"Map of the ULB Solbosch Campus, the location of the FOSDEM event"
					}
					year={year}
				/>
				<div className="w-full">
					<Image
						src="images/map.png"
						alt="Map of the ULB Solbosch Campus, the location of the FOSDEM event"
					/>
					<p className="text-sm text-muted-foreground mt-4">
						Get directions in{" "}
						<a href="https://www.openstreetmap.org/relation/13699100#map=17/50.812814/4.381442">
							OpenStreetMap
						</a>
						.
					</p>
				</div>
			</div>
		</div>
	);
}
