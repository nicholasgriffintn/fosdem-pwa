"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/start";
import { useEffect, useMemo } from "react";

import type { Event } from "~/types/fosdem";
import { createStandardDate } from "../lib/dateTime";
import { getNotes, createNote } from "~/server/functions/notes";
import { useAuth } from "~/hooks/use-auth";
import { syncAllOfflineData } from "~/lib/backgroundSync";
import { useLocalNotes } from "~/hooks/use-local-notes";

export function useNotes({
	year,
	event,
	userId,
}: {
	year: number;
	event: Event;
	userId?: string;
}) {
	const { user } = useAuth();
	const queryClient = useQueryClient();
	const getNotesFromServer = useServerFn(getNotes);
	const createNoteFromServer = useServerFn(createNote);

	const { notes: localNotes, saveNote: saveLocalNote, loading: localLoading } = useLocalNotes({
		year,
		slug: event.id,
	});

	const { data: serverNotes, isLoading: serverLoading } = useQuery({
		queryKey: ["notes", userId, year, event.id],
		queryFn: async () => {
			if (!user?.id) return [];

			const notes = await getNotesFromServer({ data: { year, eventId: event.id } });
			return notes;
		},
		enabled: !!user?.id,
		staleTime: 5 * 60 * 1000, // 5 minutes
	});

	const mergedNotes = useMemo(() => {
		if (!user?.id) {
			return localNotes || [];
		}

		if (!serverNotes || !localNotes) {
			return localNotes || serverNotes || [];
		}

		const serverMap = new Map(serverNotes.map(n => [n.id, n]));

		return localNotes.map(local => {
			// Try to find a matching server note by year/slug combination
			const matchingServerNote = serverNotes.find(serverNote =>
				serverNote.year === local.year && serverNote.slug === local.slug
			);

			return {
				...local,
				serverId: matchingServerNote?.id,
				existsOnServer: !!matchingServerNote,
			};
		}) as any;
	}, [user?.id, localNotes, serverNotes]);

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
			if (!user?.id) {
				if (!event.id) {
					console.error('Cannot save note: event.id is undefined', event);
					throw new Error('Cannot save note: event information is incomplete');
				}

				// Save locally if not authenticated
				saveLocalNote({
					year,
					slug: event.id,
					note: note,
				});
				return { success: true, tempId };
			}

			const response = await createNoteFromServer({
				data: { year, eventId: event.id, note, time },
			});

			return { ...response, tempId: tempId };
		},
		onMutate: async (newNote) => {
			await queryClient.cancelQueries({
				queryKey: ["notes", userId, year, event.id],
			});
			await queryClient.cancelQueries({
				queryKey: ["local-notes", year, event.id],
			});

			const previousNotes = queryClient.getQueryData([
				"notes",
				userId,
				year,
				event.id,
			]);

			const previousLocalNotes = queryClient.getQueryData([
				"local-notes",
				year,
				event.id,
			]);

			const timestamp = createStandardDate(new Date()).getTime();
			const optimisticNote = {
				id: newNote.tempId,
				note: newNote.note,
				time: newNote.time,
				created_at: timestamp,
				isPending: true,
			};

			// Update both server and local queries
			queryClient.setQueryData(
				["notes", userId, year, event.id],
				(old: any[] = []) => [...old, optimisticNote],
			);

			queryClient.setQueryData(
				["local-notes", year, event.id],
				(old: any[] = []) => [...old, optimisticNote],
			);

			return { previousNotes, previousLocalNotes };
		},
		onSuccess: (data) => {
			queryClient.setQueryData(
				["notes", userId, year, event.id],
				(old: any[] = []) => {
					return old.map((note: any) =>
						note.id === data.tempId ? { ...data, isPending: false } : note
					);
				},
			);

			queryClient.setQueryData(
				["local-notes", year, event.id],
				(old: any[] = []) => {
					return old.map((note: any) =>
						note.id === data.tempId ? { ...data, isPending: false } : note
					);
				},
			);
		},
		onError: (err, newNote, context) => {
			queryClient.setQueryData(
				["notes", userId, year, event.id],
				context?.previousNotes,
			);

			queryClient.setQueryData(
				["local-notes", year, event.id],
				context?.previousLocalNotes,
			);
		},
		onSettled: () => {
			queryClient.invalidateQueries({
				queryKey: ["notes", userId, year, event.id],
			});

			queryClient.invalidateQueries({
				queryKey: ["local-notes", year, event.id],
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

	useEffect(() => {
		if (!user?.id) return;

		if (serverNotes && localNotes) {
			const localYearSlugs = new Set(localNotes.map(n => `${n.year}_${n.slug}`));

			const newFromServer = serverNotes.filter(n => !localYearSlugs.has(`${n.year}_${n.slug}`));

			if (newFromServer.length > 0) {
				newFromServer.forEach(serverNote => {
					saveLocalNote({
						year: serverNote.year,
						slug: serverNote.slug,
						note: serverNote.note,
						time: serverNote.time,
					});
				});
			}
		}
	}, [user?.id, serverNotes, localNotes, saveLocalNote]);

	return {
		notes: mergedNotes,
		loading: localLoading || (user?.id ? serverLoading : false),
		create: create.mutate,
	};
}
