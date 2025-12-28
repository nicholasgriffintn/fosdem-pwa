"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef } from "react";

import type { Event } from "~/types/fosdem";
import { getNotes, createNote } from "~/server/functions/notes";
import { useAuth } from "~/hooks/use-auth";
import { useLocalNotes } from "~/hooks/use-local-notes";
import {
	saveLocalNote as persistLocalNote,
	updateLocalNote as persistUpdateLocalNote,
	addToSyncQueue,
	type LocalNote,
} from "~/lib/localStorage";
import { isValidServerNote, isNumber, hasId } from "~/lib/type-guards";
import { notesQueryKeys } from "~/lib/query-keys";

type UseNotesArgs = {
	year: number;
	event: Event;
};

export function useNotes({ year, event }: UseNotesArgs) {
	const { user } = useAuth();
	const queryClient = useQueryClient();
	const reconciliationInProgress = useRef(false);
	const getNotesFromServer = useServerFn(getNotes);
	const createNoteFromServer = useServerFn(createNote);

	const { notes: localNotes, loading: localLoading } = useLocalNotes({
		year,
		slug: event?.id,
	});

	const userKey = user?.id ?? "guest";
	const serverQueryKey = ["notes", userKey, year, event?.id] as const;
	const localQueryKey = ["local-notes", year, event?.id] as const;

	const { data: serverNotes, isLoading: serverLoading } = useQuery({
		queryKey: serverQueryKey,
		queryFn: async () => {
			if (!user?.id) return [];

			const notes = await getNotesFromServer({
				data: { year, eventId: event?.id },
			});
			return notes;
		},
		enabled: !!user?.id,
		staleTime: 5 * 60 * 1000, // 5 minutes
	});

	const mergedNotes = useMemo(() => {
		if (!user?.id) {
			return localNotes || [];
		}

		if (!localNotes && !serverNotes) {
			return [];
		}

		if (!serverNotes) {
			return (localNotes || []).map((note) => ({
				...note,
				isPending: true,
			}));
		}
		if (!localNotes) {
			return serverNotes || [];
		}

		const serverMap = new Map(
			serverNotes.map((note) => [String(note.id), note]),
		);

		const mergedLocalNotes = localNotes.map((local) => {
			let matchingServerNote =
				local.serverId && serverMap.get(String(local.serverId));

			if (!matchingServerNote && !local.serverId) {
				matchingServerNote = serverNotes.find(
					(serverNote) =>
						serverNote.slug === local.slug &&
						serverNote.year === local.year &&
						serverNote.note.trim() === local.note.trim() &&
						(serverNote.time ?? null) === (local.time ?? null),
				);
			}

			return {
				...local,
				serverId: matchingServerNote && hasId(matchingServerNote) ? matchingServerNote.id : undefined,
				existsOnServer: !!matchingServerNote,
				isPending: !!user?.id && !matchingServerNote,
			};
		});

		const localServerIds = new Set(
			localNotes.map((n) => n.serverId).filter(Boolean),
		);
		const unmatchedServerNotes = serverNotes
			.filter((sn) => !localServerIds.has(sn.id))
			.map((serverNote) => ({
				...serverNote,
				id: `${serverNote.year}_${serverNote.slug}_${Date.now()}_server`,
				serverId: serverNote.id,
				existsOnServer: true,
				isPending: false,
			}));

		return [...mergedLocalNotes, ...unmatchedServerNotes];
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
			if (!event?.id) {
				throw new Error("Cannot save note: event information is incomplete");
			}

			let localNote: LocalNote;
			try {
				localNote = await persistLocalNote(
					{
						year,
						slug: event?.id,
						note,
						time,
					},
					true,
				);
			} catch (error) {
				throw new LocalNotePersistenceError(
					error instanceof Error
						? error.message
						: "Failed to save note locally",
				);
			}

			const shouldDefer =
				!!user?.id &&
				(typeof navigator !== "undefined" ? !navigator.onLine : false);

			if (!user?.id || shouldDefer) {
				if (shouldDefer) {
					await queueNoteForSync(localNote);
				}
				return { success: true, tempId, queued: shouldDefer };
			}

			try {
				const response = await createNoteFromServer({
					data: { year, eventId: event?.id, note, time },
				});

				return { ...response, tempId, queued: false };
			} catch (error) {
				await queueNoteForSync(localNote);
				console.error(
					"Failed to sync note immediately, queued for later:",
					error,
				);
				return { success: true, tempId, queued: true };
			}
		},
		onMutate: async (newNote) => {
			await queryClient.cancelQueries({ queryKey: serverQueryKey });
			await queryClient.cancelQueries({ queryKey: localQueryKey });

			const previousLocalNotes = queryClient.getQueryData(localQueryKey);

			const timestamp = new Date().toISOString();
			const optimisticNote = {
				id: newNote.tempId,
				note: newNote.note,
				time: newNote.time,
				created_at: timestamp,
				year,
				slug: event?.id,
				isPending: true,
			};

			queryClient.setQueryData(localQueryKey, (old: LocalNote[] = []) => [
				...old,
				optimisticNote,
			]);

			return { previousLocalNotes };
		},
		onSuccess: (data, variables) => {
			if (data?.queued) {
				return;
			}

			queryClient.setQueryData(localQueryKey, (old: LocalNote[] = []) => {
				return old.map((note) =>
					note.id === variables.tempId ? { ...note, isPending: false } : note,
				);
			});
		},
		onError: (err, _newNote, context) => {
			if (
				err instanceof LocalNotePersistenceError &&
				context?.previousLocalNotes
			) {
				queryClient.setQueryData(localQueryKey, context.previousLocalNotes);
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: serverQueryKey });
			queryClient.invalidateQueries({ queryKey: localQueryKey });
		},
	});

	useEffect(() => {
		if (!user?.id) return;
		if (!serverNotes || !localNotes) return;
		if (reconciliationInProgress.current) return;

		let cancelled = false;
		reconciliationInProgress.current = true;

		const reconcile = async () => {
			if (cancelled) {
				reconciliationInProgress.current = false;
				return;
			}

			try {
				const validServerNotes = serverNotes.filter(isValidServerNote);

				if (validServerNotes.length === 0) {
					return;
				}

				const localServerIdMap = new Map(
					localNotes
						.filter((note): note is LocalNote & { serverId: number } => isNumber(note.serverId))
						.map((note) => [String(note.serverId), note]),
				);

				const operations = validServerNotes.map(async (serverNote) => {
					if (cancelled) return { status: "skipped" };

					const key = String(serverNote.id);
					const existingLocalByServerId = localServerIdMap.get(key);

					try {
						if (existingLocalByServerId) {
							const needsUpdate =
								existingLocalByServerId.note !== serverNote.note ||
								(existingLocalByServerId.time ?? null) !==
								(serverNote.time ?? null);

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
							return { status: "updated" as const };
						}

						const existingLocalMatch = localNotes.find(
							(localNote) =>
								!localNote.serverId &&
								localNote.slug === serverNote.slug &&
								localNote.year === serverNote.year &&
								localNote.note.trim() === serverNote.note.trim() &&
								(localNote.time ?? null) === (serverNote.time ?? null),
						);

						if (existingLocalMatch) {
							await persistUpdateLocalNote(
								existingLocalMatch.id,
								{
									serverId: serverNote.id,
								},
								true,
							);
							return { status: "linked" as const };
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
						return { status: "created" as const };
					} catch (error) {
						console.error(`Failed to reconcile note ${serverNote.id}:`, error);
						return { status: "failed" as const, error };
					}
				});

				const results = await Promise.allSettled(operations);
				const failures = results.filter(
					(r) => r.status === "rejected" || (r.status === "fulfilled" && r.value?.status === "failed")
				);

				if (failures.length > 0) {
					console.warn(
						`Note reconciliation completed with ${failures.length} failures out of ${results.length} operations`
					);
				}

				if (!cancelled) {
					await queryClient.invalidateQueries({
						queryKey: notesQueryKeys.localItem(year, event?.id),
					});
				}
			} catch (error) {
				console.error("Failed to persist server notes locally:", error);
			} finally {
				reconciliationInProgress.current = false;
			}
		};

		void reconcile();

		return () => {
			cancelled = true;
		};
	}, [user?.id, serverNotes, localNotes, year, event?.id, queryClient]);

	return {
		notes: mergedNotes,
		loading: localLoading || (user?.id ? serverLoading : false),
		create: create.mutate,
	};
}

class LocalNotePersistenceError extends Error {
	constructor(message?: string) {
		super(message ?? "Failed to save note locally");
		this.name = "LocalNotePersistenceError";
	}
}

async function queueNoteForSync(localNote: LocalNote) {
	try {
		await addToSyncQueue({
			id: localNote.id,
			type: "note",
			action: "create",
			data: {
				year: localNote.year,
				slug: localNote.slug,
				content: localNote.note,
				time: localNote.time,
				serverId: localNote.serverId,
			},
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Failed to queue note for sync:", error);
	}
}
