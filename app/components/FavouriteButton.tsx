"use client";

import { useState, useEffect } from "react";

import { Button } from "~/components/ui/button";
import { Icons } from "~/components/Icons";
import { toast } from "~/hooks/use-toast";
import { useAuth } from "~/hooks/use-auth";
import { useBookmarks } from "~/hooks/use-bookmarks";
import { Spinner } from "~/components/Spinner";

type FavouriteButtonProps = {
	year: number;
	type: string;
	slug: string;
	status: string;
};

export function FavouriteButton({
	year,
	type,
	slug,
	status,
}: FavouriteButtonProps) {
	const { user } = useAuth();
	const { create } = useBookmarks({ year });
	const [currentStatus, setCurrentStatus] = useState(status);

	useEffect(() => {
		setCurrentStatus(status);
	}, [status]);

	const handleFavourite = () => {
		if (!user) {
			toast({
				title: "You must be signed in to favourite",
				variant: "destructive",
			});
			return;
		}

		create({
			type,
			slug,
			status: currentStatus === "favourited" ? "unfavourited" : "favourited",
		});

		setCurrentStatus(
			currentStatus === "favourited" ? "unfavourited" : "favourited",
		);

		toast({
			title: currentStatus === "favourited" ? "Unfavourited" : "Favourited",
			description: "You can undo this action by clicking the button again",
		});
	};

	return (
		<Button
			variant="outline"
			onClick={handleFavourite}
			disabled={currentStatus === "loading"}
		>
			{currentStatus === "loading" ? (
				<Spinner />
			) : (
				<Icons.star
					className={currentStatus === "favourited" ? "icon--filled" : ""}
				/>
			)}
		</Button>
	);
}
