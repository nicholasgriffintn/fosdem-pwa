import { conferenceConfig } from "@roomisfull/conference";
import { createFileRoute } from "@tanstack/react-router";

import { TypesList } from "~/components/Type/TypesList";
import { getAllData } from "~/server/functions/schedule";
import { PageHeader } from "~/components/shared/PageHeader";
import { ConferenceScheduleNotice } from "~/components/shared/ConferenceScheduleNotice";
import { constants } from "~/constants";
import { EmptyStateCard } from "~/components/shared/EmptyStateCard";
import { Button } from "~/components/ui/button";
import { YearSelector } from "~/components/Footer/YearSelector";
import { Icons } from "~/components/shared/Icons";
import { LoadingState } from "~/components/shared/LoadingState";
import { PageShell } from "~/components/shared/PageShell";
import { SectionStack } from "~/components/shared/SectionStack";

export const Route = createFileRoute("/")({
	component: Home,
	validateSearch: ({ year }: { year: number }) => ({
		year: constants.AVAILABLE_YEARS.includes(year)
			? year
			: constants.DEFAULT_YEAR,
	}),
	loaderDeps: ({ search: { year } }) => ({ year }),
	loader: async ({ deps: { year } }) => {
		const data = await getAllData({ data: { year } });
		return {
			schedule: {
				conference: data.conference,
				types: data.types,
				tracks: data.tracks,
			},
		};
	},
	head: ({ loaderData }) => ({
		meta: [
			{
				title: `${loaderData?.schedule.conference?.title || conferenceConfig.name} | Schedule & Events`,
			},
			{
				name: "description",
				content: `${loaderData?.schedule.conference?.title || conferenceConfig.name} - ${loaderData?.schedule.conference?.city || conferenceConfig.city} conference schedule. Browse tracks, events, and speakers.`,
			},
			{
				property: "og:title",
				content: `${loaderData?.schedule.conference?.title || conferenceConfig.name} Schedule`,
			},
			{
				property: "og:description",
				content: `${loaderData?.schedule.conference?.title || conferenceConfig.name} - ${loaderData?.schedule.conference?.city || conferenceConfig.city} conference schedule and events`,
			},
			{
				property: "og:type",
				content: "website",
			},
		],
	}),
	staleTime: 1000 * 60 * 5, // 5 minutes
});

function Home() {
	const { schedule } = Route.useLoaderData();
	const { year } = Route.useSearch();

	if (!schedule) {
		return (
			<LoadingState
				type="spinner"
				message="Loading conference data..."
				variant="full"
			/>
		);
	}

	return (
		<PageShell>
			<PageHeader
				heading={schedule.conference.title}
				text={`${schedule.conference.city} / ${schedule.conference.start} - ${schedule.conference.end}`}
				year={year}
			>
				<YearSelector id="header-year-select" />
			</PageHeader>

			{!schedule.types || Object.keys(schedule.types).length === 0 ? (
				<EmptyStateCard
					title="No schedule data yet"
					description="We couldn't load tracks and types for this year. Please check back shortly."
				/>
			) : (
				<SectionStack>
					<ConferenceScheduleNotice
						conference={schedule.conference}
						year={year}
					/>

					{schedule.types ? (
						<TypesList types={schedule.types} tracks={schedule.tracks} />
					) : (
						<EmptyStateCard
							title="No schedule data yet"
							description="We couldn't load tracks and types for this year. Please check back shortly."
						/>
					)}

					<div className="w-full rounded-xl border-2 border-dotted border-border bg-muted/30 p-6 shadow-sm md:p-8">
						<div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
							<div className="space-y-2 text-left">
								<h2 className="text-xl font-semibold text-foreground">
									Looking for the official {conferenceConfig.name} site?
								</h2>
								<p className="text-sm text-muted-foreground">
									This app is a schedule companion. For official announcements
									and event details, visit the conference website.
								</p>
							</div>
							<Button asChild variant="secondary">
								<a
									href={conferenceConfig.website}
									target="_blank"
									rel="noreferrer"
									className="no-underline hover:underline"
								>
									Visit conference website{" "}
									<Icons.externalLink className="inline-block h-4 w-4" />
								</a>
							</Button>
						</div>
					</div>
				</SectionStack>
			)}
		</PageShell>
	);
}
