import type { Event, Person } from "~/types/fosdem";

type EventSpeakersProps = {
	event: Event;
	persons?: Record<string, Person>;
};

export function EventSpeakers({ event, persons }: EventSpeakersProps) {
	if (!event.persons || event.persons.length === 0) {
		return null;
	}

	return (
		<div className="prose prose-lg prose-indigo mt-4 text-foreground">
			<h2 className="text-xl font-medium text-foreground">Speakers</h2>
			<div className="mt-2 space-y-4">
				{event.persons.map((personName, index) => {
					const personId = event.personIds?.[index];
					const person =
						personId && persons?.[personId]
							? persons[personId]
							: Object.values(persons || {}).find(
								(p) => p.name === personName,
							);

					if (person && (person.biography || person.extended_biography)) {
						return (
							<div key={person.id || index} className="border-l-4 border-primary pl-4 py-2">
								<h3 className="text-normal font-semibold text-foreground mb-2">
									{person.name}
								</h3>
								{(person.biography || person.extended_biography) && (
									<div
										className="text-sm text-muted-foreground"
										// biome-ignore lint/security/noDangerouslySetInnerHtml: Biography is HTML from FOSDEM
										dangerouslySetInnerHTML={{
											__html:
												person.extended_biography ||
												person.biography ||
												"",
										}}
									/>
								)}
							</div>
						);
					}

					return (
						<div key={index} className="text-foreground">
							<span>{personName}</span>
						</div>
					);
				})}
			</div>
		</div>
	);
}
