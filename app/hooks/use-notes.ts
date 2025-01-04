"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import type { Event } from "~/types/fosdem";

export function useNotes({
	year,
	event,
	userId,
}: { year: number; event: Event; userId?: string }) {
	const queryClient = useQueryClient();

	const { data: notes, isLoading } = useQuery({
		queryKey: ["notes", userId, year, event.slug],
		queryFn: async () => {
			const response = await fetch(
				`/api/user/github/${userId}/notes/${year}/${event.id}`,
			);
			if (!response.ok) return null;
			const data = await response.json();
			return data;
		},
	});

	const create = useMutation({
		mutationFn: async ({
			note,
			time,
			tempId,
		}: {
			note: string;
			time?: number;
			tempId: string;
		}) => {
			const response = await fetch(
				`/api/user/github/${userId}/notes/${year}/${event.id}`,
				{
					method: "POST",
					body: JSON.stringify({ note, time }),
				},
			);
			if (!response.ok) {
				throw new Error("Failed to create note");
			}
			return { ...(await response.json()), tempId };
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
					const optimisticNote = {
						id: newNote.tempId,
						note: newNote.note,
						time: newNote.time,
						created_at: new Date(),
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
						note.id === data.tempId ? { ...data, isPending: false } : note,
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
