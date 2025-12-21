"use client";

import { useState, useEffect } from "react";

import { Button } from "~/components/ui/button";
import { Icons } from "~/components/Icons";
import { toast } from "~/hooks/use-toast";
import { shareSupported, clipboardSupported } from "~/lib/browserSupport";

type ShareButtonProps = {
	title: string;
	text: string;
	url: string;
};

export function ShareButton({ title, text, url }: ShareButtonProps) {
	const [isClient, setIsClient] = useState(false);

	useEffect(() => {
		setIsClient(true);
	}, []);

	const handleShare = async () => {
		try {
			if (shareSupported() && navigator.canShare({ title, text, url })) {
				await navigator.share({ title, text, url });
				return;
			}

			if (clipboardSupported()) {
				await navigator.clipboard.writeText(`${text}: ${url}`);
				toast({
					title: "Link copied",
					description: "The link has been copied to your clipboard",
				});
				return;
			}

			toast({
				title: "Unable to share",
				description: `Please copy this URL manually: ${url}`,
				variant: "destructive",
				duration: 10000,
			});
		} catch (error) {
			if (error instanceof Error && error.name !== "AbortError") {
				toast({
					title: "Failed to share",
					description: `Please copy this URL manually: ${url}`,
					variant: "destructive",
					duration: 10000,
				});
			}
		}
	};

	if (!isClient) {
		return (
			<div className="inline-flex items-center gap-2 px-3 py-2 text-xs border border-muted rounded-md max-w-[300px]">
				<Icons.share className="h-4 w-4 flex-shrink-0" />
				<input
					type="text"
					readOnly
					value={url}
					className="bg-transparent border-none text-[10px] font-mono w-full min-w-0 focus:outline-none focus:ring-1 focus:ring-primary rounded px-1"
					onClick={(e) => e.currentTarget.select()}
					title="Click to select URL"
				/>
			</div>
		);
	}

	return (
		<Button variant="outline" onClick={handleShare}>
			<Icons.share className="h-4 w-4" />
		</Button>
	);
}
