"use client";

import { Button } from "~/components/ui/button";
import { Icons } from "~/components/Icons";
import { EventNotes } from "~/components/Event/EventNotes";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "~/components/ui/sheet";
import type { Event } from "~/types/fosdem";

type EventNotesMobileProps = {
	event: Event;
	year: number;
};

export function EventNotesMobile({
	event,
	year,
}: EventNotesMobileProps) {
	return (
		<Sheet>
			<SheetTrigger asChild>
				<Button variant="outline" className="w-full">
					<Icons.pencil className="h-4 w-4" />
					<span>Open Notes</span>
				</Button>
			</SheetTrigger>
			<SheetContent side="right" className="w-full sm:max-w-lg">
				<SheetHeader>
					<SheetTitle>Notes</SheetTitle>
				</SheetHeader>
				<div className="mt-4 h-[calc(100vh-8rem)]">
					<EventNotes
						event={event}
						year={year}
						isMobile={true}
					/>
				</div>
			</SheetContent>
		</Sheet>
	);
}
