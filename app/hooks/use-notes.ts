"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/start";

import type { Event } from "~/types/fosdem";
import { createStandardDate } from "../lib/dateTime";
import { getNotes, createNote } from "~/server/functions/notes";

export function useNotes({
	year,
	event,
	userId,
}: {
	year: number;
	event: Event;
	userId?: string;
}) {
	const queryClient = useQueryClient();
	const getNotesFromServer = useServerFn(getNotes);
	const createNoteFromServer = useServerFn(createNote);

	const { data: notes, isLoading } = useQuery({
		queryKey: ["notes", userId, year, event.slug],
		queryFn: async () => {
			const notes = await getNotesFromServer({ data: { year, eventId: event.id } });
			return notes;
		},
	});

	const create = useMutation({
		mutationKey: ["createNote"],
		mutationFn: async ({
			note,
			time,
			tempId,
		}: {
			note: string;
			time?: number;
			tempId: string;
		}) => {
			const response = await createNoteFromServer({
				data: { year, eventId: event.id, note, time },
			});

			return { ...response, tempId: tempId };
		},
		onMutate: async (newNote) => {
			await queryClient.cancelQueries({
				queryKey: ["notes", userId, year, event.slug],
			});
			const previousNotes = queryClient.getQueryData([
				"notes",
				userId,
				year,
				event.slug,
			]);

			queryClient.setQueryData(
				["notes", userId, year, event.slug],
				(old: any[] = []) => {
					const timestamp = createStandardDate(new Date()).getTime();
					const optimisticNote = {
						id: newNote.tempId,
						note: newNote.note,
						time: newNote.time,
						created_at: timestamp,
						isPending: true,
					};
					return [...old, optimisticNote];
				},
			);

			return { previousNotes };
		},
		onSuccess: (data) => {
			queryClient.setQueryData(
				["notes", userId, year, event.slug],
				(old: any[] = []) => {
					return old.map((note: any) =>
						note.id === data.tempId ? { ...data, isPending: false } : note
					);
				},
			);
		},
		onError: (err, newNote, context) => {
			queryClient.setQueryData(
				["notes", userId, year, event.slug],
				context?.previousNotes,
			);
		},
		onSettled: () => {
			queryClient.invalidateQueries({
				queryKey: ["notes", userId, year, event.slug],
			});
		},
	});

	return {
		notes,
		loading: isLoading,
		create: create.mutate,
	};
}
