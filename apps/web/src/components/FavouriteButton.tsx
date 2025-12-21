"use client";

import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";

import { Button } from "~/components/ui/button";
import { Icons } from "~/components/Icons";
import { toast } from "~/hooks/use-toast";
import { Spinner } from "~/components/Spinner";
import { useIsClient } from "~/hooks/use-is-client";
import { createBookmarkFromForm } from "~/server/functions/bookmarks";
import { useAuthSnapshot } from "~/contexts/AuthSnapshotContext";

type FavouriteButtonProps = {
	year: number;
	type: string;
	slug: string;
	status: string;
	onCreateBookmark: ({
		year,
		type,
		slug,
		status,
	}: {
		year: number;
		type: string;
		slug: string;
		status: string;
	}) => Promise<void> | void;
};

function buildUpSearchParams(search: {
	year?: number | undefined;
	type?: string | undefined;
	day?: string | null | undefined;
	test?: boolean | undefined;
	time?: string | undefined;
	track?: string | undefined;
	sortFavourites?: string | undefined;
	view?: string | undefined;
	q?: string | undefined;
}) {
	const params = Object.entries(search)
		.filter(([, value]) => value !== undefined && value !== null)
		.map(
			([key, value]) =>
				`${encodeURIComponent(key)}=${encodeURIComponent(
					String(value),
				)}`,
		)
		.join("&");
	return params ? `?${params}` : "";
}

export function FavouriteButton({
	year,
	type,
	slug,
	status,
	onCreateBookmark,
}: FavouriteButtonProps) {
	const isClient = useIsClient();
	const { user: serverUser } = useAuthSnapshot();
	const returnTo = useRouterState({
		select: (state) => {
			const searchValue = state.location.search;
			if (searchValue) {
				return `${state.location.pathname}${buildUpSearchParams(searchValue)}`;
			}
			return state.location.pathname;
		},
	});
	const [currentStatus, setCurrentStatus] = useState(status);
	const [isProcessing, setIsProcessing] = useState(false);
	const lastSyncedStatusRef = useRef(status);

	useEffect(() => {
		if (isProcessing) {
			return;
		}

		if (lastSyncedStatusRef.current !== status) {
			lastSyncedStatusRef.current = status;
			setCurrentStatus(status);
		}
	}, [status, isProcessing]);

	const handleFavourite = async (e: React.MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();
		if (onCreateBookmark && !isProcessing) {
			const newStatus = currentStatus === "favourited" ? "unfavourited" : "favourited";
			const previousStatus = currentStatus;

			setIsProcessing(true);
			setCurrentStatus(newStatus);

			toast({
				title: newStatus === "favourited" ? "Favourited" : "Unfavourited",
				description: "You can undo this action by clicking the button again",
			});

			try {
				await onCreateBookmark({
					year,
					type,
					slug,
					status: newStatus,
				});
			} catch (error) {
				setCurrentStatus(previousStatus);
				toast({
					title: "Error",
					description: "Failed to update bookmark. Please try again.",
					variant: "destructive",
				});
			} finally {
				setIsProcessing(false);
			}
		}
	};

	if (!isClient) {
		const nextStatus =
			status === "favourited" ? "unfavourited" : "favourited";
		const canSubmit = Boolean(serverUser?.id);

		return (
			<form method="post" action={createBookmarkFromForm.url}>
				<input type="hidden" name="year" value={year} />
				<input type="hidden" name="type" value={type} />
				<input type="hidden" name="slug" value={slug} />
				<input type="hidden" name="status" value={nextStatus} />
				<input type="hidden" name="returnTo" value={returnTo} />
				<Button
					variant="outline"
					disabled={!canSubmit}
					title={
						canSubmit
							? "Bookmark this item"
							: "Sign in to bookmark events"
					}
					type="submit"
				>
					<Icons.star
						className={status === "favourited" ? "icon--filled" : ""}
					/>
				</Button>
			</form>
		);
	}

	return (
		<Button
			variant="outline"
			onClick={handleFavourite}
			disabled={currentStatus === "loading" || isProcessing}
		>
			{currentStatus === "loading" || isProcessing ? (
				<Spinner />
			) : (
				<Icons.star
					className={currentStatus === "favourited" ? "icon--filled" : ""}
				/>
			)}
		</Button>
	);
}
