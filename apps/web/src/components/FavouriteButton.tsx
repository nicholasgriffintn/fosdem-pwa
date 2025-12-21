"use client";

import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";

import { Button } from "~/components/ui/button";
import { Icons } from "~/components/Icons";
import { toast } from "~/hooks/use-toast";
import { Spinner } from "~/components/Spinner";
import { useIsClient } from "~/hooks/use-is-client";
import { createBookmark } from "~/server/functions/bookmarks";
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
		select: (state) => `${state.location.pathname}${state.location.search}`,
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
			<form method="post" action={createBookmark.url}>
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
