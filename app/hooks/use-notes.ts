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
import {
	saveLocalNote as persistLocalNote,
	updateLocalNote as persistUpdateLocalNote,
	type LocalNote,
} from "~/lib/localStorage";

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

	const { notes: localNotes, saveNote: saveLocalNoteMutation, loading: localLoading } = useLocalNotes({
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

		const serverMap = new Map(serverNotes.map(note => [String(note.id), note]));

		return localNotes.map(local => {
			let matchingServerNote =
				(local.serverId &&
					serverMap.get(String(local.serverId))) ||
				serverNotes.find(serverNote =>
					serverNote.slug === local.slug &&
					serverNote.year === local.year &&
					serverNote.note === local.note &&
					(serverNote.time ?? null) === (local.time ?? null)
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

				saveLocalNoteMutation({
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
			const localServerIds = new Set(
				localNotes
					.filter((note): note is LocalNote & { serverId: number } => typeof note.serverId === "number")
					.map(note => String(note.serverId)),
			);

			const serverNotesMissingLocally = serverNotes.filter(
				serverNote => !localServerIds.has(String(serverNote.id)),
			);

			if (serverNotesMissingLocally.length > 0) {
				(async () => {
					try {
						for (const serverNote of serverNotesMissingLocally) {
							const existingLocalMatch = localNotes.find(localNote =>
								!localNote.serverId &&
								localNote.slug === serverNote.slug &&
								localNote.note === serverNote.note &&
								(localNote.time ?? null) === (serverNote.time ?? null)
							);

							if (existingLocalMatch) {
								await persistUpdateLocalNote(
									existingLocalMatch.id,
									{
										serverId: serverNote.id,
										note: serverNote.note,
										time: serverNote.time,
									},
									true,
								);
								continue;
							}

							await persistLocalNote(
								{
									year: Number(serverNote.year),
									slug: serverNote.slug,
									note: serverNote.note,
									time: serverNote.time,
									serverId: serverNote.id,
								},
								true,
							);
						}

						await queryClient.invalidateQueries({
							queryKey: ["local-notes", year, event.id],
						});
					} catch (error) {
						console.error('Failed to persist server notes locally:', error);
					}
				})();
			}
		}
	}, [user?.id, serverNotes, localNotes, year, event.id, queryClient]);

	return {
		notes: mergedNotes,
		loading: localLoading || (user?.id ? serverLoading : false),
		create: create.mutate,
	};
}
