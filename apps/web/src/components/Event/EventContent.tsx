import type { Event, Person } from "~/types/fosdem";
import { EventSpeakers } from "~/components/Event/EventSpeakers";

type EventContentProps = {
	year: number;
	event: Event;
	persons?: Record<string, Person>;
};

export function EventContent({ year, event, persons }: EventContentProps) {
	return (
		<>
			{event.language && event.language !== "en" && (
				<div className="text-base text-muted-foreground mt-2">
					Please note: This event is in the language{" "}
					<strong>{event.language}</strong>.
				</div>
			)}
			{event.abstract && (
				<div className="mt-4">
					<h2 className="text-xl font-medium text-foreground">Abstract</h2>
					<div
						className="mt-2 prose prose-lg prose-indigo mt-4 text-foreground"
						dangerouslySetInnerHTML={{ __html: event.abstract }}
					/>
				</div>
			)}
			{event.description && (
				<div className="mt-4">
					<h2 className="text-xl font-medium text-foreground">Description</h2>
					<div
						className="mt-2 prose prose-lg prose-indigo mt-4 text-foreground"
						dangerouslySetInnerHTML={{ __html: event.description }}
					/>
				</div>
			)}
			{event.attachments?.length > 0 && (
				<div className="mt-4">
					<h2 className="text-xl font-medium text-foreground">Attachments</h2>
					<ul className="mt-2 space-y-2 list-disc list-inside">
						{event.attachments.map((attachment) => (
							<li key={attachment.href}>
								<a href={attachment.href} target="_blank" rel="noreferrer">
									{attachment.title}
								</a>
							</li>
						))}
					</ul>
				</div>
			)}
			<EventSpeakers year={year} event={event} persons={persons} />
			{event.links?.length > 0 && (
				<div className="mt-4">
					<h2 className="text-xl font-medium text-foreground">Links</h2>
					<ul className="mt-2 space-y-2 list-disc list-inside">
						{event.links.map((link) => (
							<li key={link.href}>
								<a href={link.href} target="_blank" rel="noreferrer">
									{link.title}
								</a>
							</li>
						))}
					</ul>
				</div>
			)}
			{(event.url || event.feedbackUrl) && (
				<div className="mt-4">
					<h2 className="text-xl font-medium text-foreground">
						External Links
					</h2>
					<ul className="mt-2 space-y-2 list-disc list-inside">
						{event.url && (
							<li>
								<a href={event.url} target="_blank" rel="noreferrer">
									View on the FOSDEM website
								</a>
							</li>
						)}
						{event.feedbackUrl && (
							<li>
								<a href={event.feedbackUrl} target="_blank" rel="noreferrer">
									Provide Feedback
								</a>
							</li>
						)}
					</ul>
				</div>
			)}
		</>
	);
}
