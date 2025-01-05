"use client";

import { Button } from "~/components/ui/button";
import { Icons } from "~/components/Icons";
import { toast } from "~/hooks/use-toast";
import { shareSupported, clipboardSupported } from "~/lib/browserSupport";

type ShareButtonProps = {
	title: string;
	text: string;
	url: string;
};

export function ShareButton({
	title,
	text,
	url,
}: ShareButtonProps) {
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

	return (
		<Button variant="outline" onClick={handleShare}>
			<Icons.share className="h-4 w-4" />
		</Button>
	);
}
