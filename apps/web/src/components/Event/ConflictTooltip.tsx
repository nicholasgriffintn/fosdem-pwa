"use client";

import { useState } from "react";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/components/ui/dialog";
import { Icons } from "~/components/shared/Icons";
import type { EventConflict } from "~/lib/fosdem";
import type { Event } from "~/types/fosdem";
import { Button } from "~/components/ui/button";

type ConflictTooltipProps = {
	event: Event;
	conflicts?: EventConflict[];
	className?: string;
	onSetPriority?: (
		eventId: string,
		updates: { priority: number | null },
	) => void;
	priority?: number;
};

export function ConflictTooltip({
	event,
	conflicts,
	className,
	onSetPriority,
	priority,
}: ConflictTooltipProps) {
	const [isOpen, setIsOpen] = useState(false);
	const eventConflicts = conflicts?.filter(
		(conflict) =>
			conflict.event1.id === event.id || conflict.event2.id === event.id,
	);

	if (!eventConflicts?.length) {
		return null;
	}

	const getPriorityColor = (p?: number) => {
		if (!p) return "bg-destructive text-destructive-foreground";
		switch (p) {
			case 1:
				return "bg-primary text-primary-foreground";
			case 2:
				return "bg-orange-500 text-white dark:text-primary-foreground";
			default:
				return "bg-destructive text-destructive-foreground";
		}
	};

	const handleSetPriority = (newPriority: number) => {
		if (newPriority === 0) {
			onSetPriority?.(event.id, { priority: null });
			setIsOpen(false);
			return;
		}

		onSetPriority?.(event.id, { priority: 1 });

		eventConflicts.forEach((conflict) => {
			const otherEvent =
				conflict.event1.id === event.id ? conflict.event2 : conflict.event1;
			onSetPriority?.(otherEvent.id, { priority: 2 });
		});

		setIsOpen(false);
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					className={`${className} ${getPriorityColor(priority)} hover:opacity-90`}
				>
					<div className="flex items-center gap-1.5">
						{priority ? (
							<>
								<span className="font-semibold text-sm">Priority {priority}</span>
							</>
						) : (
								<>
								<Icons.alertTriangle className="h-4 w-4" />
									<span className="font-medium text-sm">Resolve Conflict</span>
								</>
						)}
					</div>
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Schedule Conflicts</DialogTitle>
					<DialogDescription>
						"{event.title}" overlaps with {eventConflicts.length} other bookmarked event{eventConflicts.length > 1 ? "s" : ""}.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4">
					<div>
						<p className="font-semibold mb-2 text-sm">Conflicting Events:</p>
						<div className="max-h-[300px] overflow-y-auto pr-2">
							<ul className="space-y-2">
								{eventConflicts.map((conflict) => {
									const otherEvent =
										conflict.event1.id === event.id
											? conflict.event2
											: conflict.event1;
									const otherEventPriority = otherEvent.priority;
									return (
										<li
											key={otherEvent.id}
											className="text-sm bg-muted p-3 rounded-md"
										>
											<div className="font-medium break-words">
												{otherEvent.title}
											</div>
											<div className="text-xs text-muted-foreground mt-1">
												Overlaps by {conflict.overlapDuration} minutes
												{otherEventPriority &&
													` • Priority: ${otherEventPriority}`}
											</div>
										</li>
									);
								})}
							</ul>
						</div>
					</div>
					{onSetPriority && (
						<div className="border-t pt-4">
							<p className="text-sm mb-3 font-medium break-words">
								Do you want to attend this event?
							</p>
							<div className="flex gap-2 flex-col sm:flex-row">
								<Button
									size="sm"
									variant={priority === 1 ? "default" : "outline"}
									onClick={() => handleSetPriority(1)}
									className="flex-1 justify-center"
								>
									<Icons.check className="h-4 w-4 mr-1 flex-shrink-0" />
									<span>Yes, attend this event</span>
								</Button>
								{priority && (
									<Button
										size="sm"
										variant="ghost"
										onClick={() => handleSetPriority(0)}
									>
										Clear priority
									</Button>
								)}
							</div>
							{!priority && (
								<p className="text-xs text-muted-foreground mt-2">
									This will set this event as your priority and mark conflicting events as lower priority.
								</p>
							)}
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
