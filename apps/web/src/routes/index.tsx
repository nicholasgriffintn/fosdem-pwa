import { createFileRoute } from "@tanstack/react-router";

import { TypesList } from "~/components/Type/TypesList";
import { getAllData } from "~/server/functions/fosdem";
import { PageHeader } from "~/components/PageHeader";
import { ConferenceScheduleNotice } from "~/components/ConferenceScheduleNotice";
import { constants } from "~/constants";
import { EmptyStateCard } from "~/components/EmptyStateCard";
import { Button } from "~/components/ui/button";
import { YearSelector } from "~/components/Footer/YearSelector";
import { Icons } from "../components/Icons";
import { LoadingState } from "~/components/shared/LoadingState";

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
		return <LoadingState type="spinner" message="Loading conference data..." variant="full" />;
	}

	return (
		<div className="min-h-screen">
			<div className="relative py-6 lg:py-10">
				<PageHeader
					heading={fosdem.conference.title}
					text={`${fosdem.conference.city} / ${fosdem.conference.start} - ${fosdem.conference.end}`}
					year={year}
				>
					<YearSelector id="header-year-select" />
				</PageHeader>

				{!fosdem.types || Object.keys(fosdem.types).length === 0 ? (
					<EmptyStateCard
						title="No schedule data yet"
						description="We couldn't load tracks and types for this year. Please check back shortly."
					/>
				) : (
					<>
							<ConferenceScheduleNotice conference={fosdem.conference} year={year} />

							{fosdem.types ? (
								<TypesList
									types={fosdem.types}
								/>
							) : (
								<EmptyStateCard
									title="No schedule data yet"
									description="We couldn't load tracks and types for this year. Please check back shortly."
								/>
							)}


							<div className="mt-6">
								<div className="w-full rounded-xl border-2 border-dotted border-border bg-muted/30 p-6 shadow-sm md:p-8">
									<div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
										<div className="space-y-2 text-left">
											<h2 className="text-xl font-semibold text-foreground">
												Looking for the official FOSDEM site?
											</h2>
											<p className="text-sm text-muted-foreground">
												This app is a schedule companion. For official announcements and event details, head to fosdem.org.
											</p>
										</div>
										<Button asChild variant="secondary">
											<a
												href="https://fosdem.org"
												target="_blank"
												rel="noreferrer"
												className="no-underline hover:underline"
											>
												Go to fosdem.org <Icons.externalLink className="inline-block h-4 w-4" />
											</a>
										</Button>
									</div>
								</div>
							</div>
					</>
				)}
			</div>
		</div>
	);
}
