"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/start";
import { useEffect, useMemo } from "react";

import type { Event } from "~/types/fosdem";
import { getNotes, createNote } from "~/server/functions/notes";
import type { Note } from "~/server/db/schema";
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
			if (!event.id) {
				console.error('Cannot save note: event.id is undefined', event);
				throw new Error('Cannot save note: event information is incomplete');
			}

			saveLocalNoteMutation({
				year,
				slug: event.id,
				note: note,
				time,
				skipSync: !user?.id ? false : true,
			});

			if (!user?.id) {
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

			const timestamp = new Date().toISOString();
			const optimisticNote = {
				id: newNote.tempId,
				note: newNote.note,
				time: newNote.time,
				created_at: timestamp,
				year,
				slug: event.id,
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
		onSuccess: (_data, variables) => {
			queryClient.setQueryData(
				["notes", userId, year, event.id],
				(old: any[] = []) => {
					return old.map((note: any) =>
						note.id === variables.tempId ? { ...note, isPending: false } : note
					);
				},
			);

			queryClient.setQueryData(
				["local-notes", year, event.id],
				(old: any[] = []) => {
					return old.map((note: any) =>
						note.id === variables.tempId ? { ...note, isPending: false } : note
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
			const validServerNotes = serverNotes.filter(
				(note): note is Note & { id: number; year: number; slug: string } =>
					note &&
					typeof note.id === "number" &&
					typeof note.year === "number" &&
					typeof note.slug === "string" &&
					note.slug.length > 0,
			);

			if (validServerNotes.length === 0) {
				return;
			}

			const localServerIdMap = new Map(
				localNotes
					.filter((note): note is LocalNote & { serverId: number } => typeof note.serverId === "number")
					.map((note) => [String(note.serverId), note]),
			);

			(async () => {
				try {
					for (const serverNote of validServerNotes) {
						const key = String(serverNote.id);
						const existingLocalByServerId = localServerIdMap.get(key);

						if (existingLocalByServerId) {
							const needsUpdate =
								existingLocalByServerId.note !== serverNote.note ||
								(existingLocalByServerId.time ?? null) !== (serverNote.time ?? null);

							if (needsUpdate) {
								await persistUpdateLocalNote(
									existingLocalByServerId.id,
									{
										note: serverNote.note,
										time: serverNote.time,
									},
									true,
								);
							}
							continue;
						}

						const existingLocalMatch = localNotes.find(localNote =>
							!localNote.serverId &&
							localNote.slug === serverNote.slug &&
							localNote.year === serverNote.year &&
							localNote.note === serverNote.note &&
							(localNote.time ?? null) === (serverNote.time ?? null)
						);

						if (existingLocalMatch) {
							await persistUpdateLocalNote(
								existingLocalMatch.id,
								{
									serverId: serverNote.id,
								},
								true,
							);
							continue;
						}

						await persistLocalNote(
							{
								year: serverNote.year,
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
	}, [user?.id, serverNotes, localNotes, year, event.id, queryClient]);

	return {
		notes: mergedNotes,
		loading: localLoading || (user?.id ? serverLoading : false),
		create: create.mutate,
	};
}
