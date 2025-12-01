"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";

import { useAuth } from "~/hooks/use-auth";
import { syncAllOfflineData } from "~/lib/backgroundSync";
import {
	getLocalNotes,
	saveLocalNote,
	updateLocalNote,
	removeLocalNote,
	type LocalNote,
} from "~/lib/localStorage";

export function useLocalNotes({ year, slug }: { year: number; slug: string }) {
	const { user } = useAuth();

	const queryClient = useQueryClient();

	const { data: localNotes, isLoading: localLoading } = useQuery({
		queryKey: ["local-notes", year, slug],
		queryFn: async () => {
			const allNotes = await getLocalNotes(year);
			return allNotes.filter(note => note.slug && note.slug === slug);
		},
		staleTime: 0,
		structuralSharing: false,
	});

	const saveNote = useMutation({
		mutationFn: async (
			data: Omit<LocalNote, 'id' | 'created_at' | 'updated_at'> & { skipSync?: boolean },
		) => {
			if (!data) {
				throw new Error('Note data is required');
			}

			const { skipSync, ...rest } = data;
			const payload = {
				...rest,
				year: rest.year ?? year,
				slug: rest.slug ?? slug,
			} as Omit<LocalNote, 'id' | 'created_at' | 'updated_at'>;

			return saveLocalNote(payload, skipSync);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["local-notes", year, slug],
			});
		},
	});

	const updateNote = useMutation({
		mutationFn: async ({ id, updates }: { id: string; updates: Partial<LocalNote> }) => {
			return updateLocalNote(id, updates);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["local-notes", year, slug],
			});
		},
	});

	const deleteNote = useMutation({
		mutationFn: async (id: string) => {
			return removeLocalNote(id);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["local-notes", year, slug],
			});
		},
	});

	useEffect(() => {
		if (!user?.id) return;

		if (localNotes && localNotes.length > 0) {
			syncAllOfflineData().catch(error => {
				console.error('Background sync failed:', error);
			});
		}
	}, [user?.id, localNotes]);

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
