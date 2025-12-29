"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
	getLocalNotes,
	saveLocalNote,
	updateLocalNote,
	removeLocalNote,
	type LocalNote,
} from "~/lib/localStorage";
import { notesQueryKeys } from "~/lib/query-keys";

export function useLocalNotes({ year, slug }: { year: number; slug: string }) {
	const queryClient = useQueryClient();

	const { data: localNotes, isLoading: localLoading } = useQuery({
		queryKey: notesQueryKeys.localItem(year, slug),
		queryFn: async () => {
			const allNotes = await getLocalNotes(year);
			return allNotes.filter((note) => note.slug && note.slug === slug);
		},
		staleTime: 1000 * 60 * 5, // 5 minutes
		gcTime: 10 * 60 * 1000,
	});

	const saveNote = useMutation({
		mutationFn: async (
			data: Omit<LocalNote, "id" | "created_at" | "updated_at"> & {
				skipSync?: boolean;
			},
		) => {
			if (!data) {
				throw new Error("Note data is required");
			}

			const { skipSync, ...rest } = data;
			const payload = {
				...rest,
				year: rest.year ?? year,
				slug: rest.slug ?? slug,
			} as Omit<LocalNote, "id" | "created_at" | "updated_at">;

			return saveLocalNote(payload, skipSync);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: notesQueryKeys.localItem(year, slug),
			});
		},
	});

	const updateNote = useMutation({
		mutationFn: async ({
			id,
			updates,
		}: {
			id: string;
			updates: Partial<LocalNote>;
		}) => {
			return updateLocalNote(id, updates);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: notesQueryKeys.localItem(year, slug),
			});
		},
	});

	const deleteNote = useMutation({
		mutationFn: async (id: string) => {
			return removeLocalNote(id);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: notesQueryKeys.localItem(year, slug),
			});
		},
	});

	return {
		notes: localNotes || [],
		loading: localLoading,
		saveNote: saveNote.mutate,
		updateNote: updateNote.mutate,
		deleteNote: deleteNote.mutate,
		isSaving: saveNote.isPending,
		isUpdating: updateNote.isPending,
		isDeleting: deleteNote.isPending,
	};
}
