"use client";

import { useState, useEffect, useRef } from "react";

import { Button } from "~/components/ui/button";
import { Icons } from "~/components/Icons";
import { toast } from "~/hooks/use-toast";
import { Spinner } from "~/components/Spinner";

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
	const [isClient, setIsClient] = useState(false);
	const [currentStatus, setCurrentStatus] = useState(status);
	const [isProcessing, setIsProcessing] = useState(false);
	const lastSyncedStatusRef = useRef(status);

	useEffect(() => {
		setIsClient(true);
	}, []);

	useEffect(() => {
		if (isProcessing) {
			return;
		}

		if (lastSyncedStatusRef.current !== status) {
			lastSyncedStatusRef.current = status;
			setCurrentStatus(status);
		}
	}, [status, isProcessing]);

	const handleFavourite = async () => {
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

	return (
		<Button
			variant="outline"
			onClick={handleFavourite}
			disabled={isClient && (currentStatus === "loading" || isProcessing)}
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
