import { getConferences } from "@roomisfull/conference/registry";

import { PageShell } from "~/components/shared/PageShell";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";

export function ConferenceDirectory() {
	return (
		<PageShell>
			<h1 className="font-heading text-4xl lg:text-5xl">Conferences</h1>
			<p className="my-4 text-xl text-muted-foreground">
				Choose a conference to explore the programme and plan your schedule.
			</p>
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{getConferences().map((conference) => (
					<Card key={conference.id}>
						<CardHeader>
							<CardTitle>{conference.name}</CardTitle>
							<CardDescription>{conference.city}</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<p className="text-sm text-muted-foreground">
								{conference.venue}
							</p>
							<Button asChild>
								<a href={conference.appUrl}>Open {conference.name}</a>
							</Button>
						</CardContent>
					</Card>
				))}
			</div>
		</PageShell>
	);
}
