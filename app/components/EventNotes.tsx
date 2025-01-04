"use client";

import { useState } from "react";

import type { Event } from "~/types/fosdem";
import { Button } from "./ui/button";
import { useNotes } from "~/hooks/use-notes";
import { Skeleton } from "./ui/skeleton";
import { toast } from "~/hooks/use-toast";

function formatTime(seconds?: number) {
	if (!seconds) return null;
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = Math.floor(seconds % 60);
	return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function formatDate(date: Date) {
	return new Date(date).toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

export function EventNotes({
	year,
	event,
	userId,
	videoRef,
	isMobile,
}: {
	year: number;
	event: Event;
	userId?: string;
	videoRef: React.RefObject<HTMLVideoElement | null>;
	isMobile?: boolean;
}) {
	const { notes, loading, create } = useNotes({ year, event, userId });
	const [note, setNote] = useState("");
	const [noteTime, setNoteTime] = useState<number | undefined>();

	const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const newValue = e.target.value;
		setNote(newValue);

		if (!note && !noteTime && newValue && videoRef.current) {
			setNoteTime(videoRef.current.currentTime);
		}

		if (newValue.trim() === "") {
			setNoteTime(undefined);
		}
	};

	const handleSave = () => {
		if (!note.trim()) return;

		create({
			note,
			time: noteTime,
			tempId: `temp-${new Date().getTime()}`,
		});
		setNote("");
		setNoteTime(undefined);
	};

	const handleClickTime = (time: number) => {
		if (videoRef.current) {
			videoRef.current.currentTime = time;
			videoRef.current.play();
		} else {
			toast({
				title: "Video not found",
				description: "Please make sure that the video is loaded",
			});
		}
	};

	return (
		<div className="flex flex-col h-full">
			<div
				className={`flex-1 overflow-y-auto mb-4 ${isMobile ? "min-h-[calc(100vh-250px)] max-h-[calc(100vh-250px)]" : "min-h-[250px] max-h-[250px]"}`}
			>
				{loading && (
					<Skeleton
						className={`h-full ${isMobile ? "min-h-[calc(100vh-250px)]" : "min-h-[250px]"}`}
					/>
				)}
				{!loading && notes && (
					<ul className="space-y-2">
						{notes.map(
							(note: {
								id: string;
								note: string;
								time?: number;
								created_at: Date;
								isPending?: boolean;
							}) => (
								<li
									key={note.id}
									className={`bg-muted/30 rounded-lg p-3 transition-opacity ${
										note.isPending ? "opacity-50" : ""
									}`}
								>
									<div className="flex flex-col gap-2">
										<p className="flex-1">{note.note}</p>
										<div className="flex items-center gap-2 text-xs text-muted-foreground">
											<span>{formatDate(note.created_at)}</span>
											{note.time && (
												<>
													<span>•</span>
													<button
														type="button"
														className="bg-primary/10 px-2 py-1 rounded-md cursor-pointer hover:bg-primary/20"
														onClick={() => {
															handleClickTime(note.time || 0);
														}}
													>
														@{formatTime(note.time)}
													</button>
												</>
											)}
										</div>
									</div>
								</li>
							),
						)}
					</ul>
				)}
			</div>

			<div className="mt-auto">
				<textarea
					className="w-full h-24 mb-2 p-2 rounded-md bg-background border placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
					placeholder="Start writing your new note here..."
					value={note}
					onChange={handleNoteChange}
				/>
				<Button onClick={handleSave} className="w-full" disabled={!note.trim()}>
					Save
				</Button>
			</div>
		</div>
	);
}
