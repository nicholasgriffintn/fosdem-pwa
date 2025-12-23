"use client";

import { Button, buttonVariants } from "~/components/ui/button";
import { Icons } from "~/components/Icons";
import { toast } from "~/hooks/use-toast";
import { shareSupported, clipboardSupported } from "~/lib/browserSupport";
import { cn } from "~/lib/utils";

type ShareButtonProps = {
	title: string;
	text: string;
	url: string;
};

export function ShareButton({ title, text, url }: ShareButtonProps) {
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
		<>
			<details className="no-js-only relative">
				<summary
					className={cn(
						buttonVariants({ variant: "outline" }),
						"cursor-pointer list-none [&::-webkit-details-marker]:hidden",
					)}
					title="Share"
					aria-label={`Share ${title}`}
				>
					<Icons.share className="h-4 w-4" />
				</summary>
				<div className="absolute right-0 mt-2 w-64 rounded-md border bg-background p-2 shadow-md z-50">
					<label className="text-xs text-muted-foreground">Copy link</label>
					<input
						type="text"
						readOnly
						value={url}
						className="mt-1 h-8 w-full rounded-md border border-input bg-background px-2 text-[10px] font-mono focus:outline-none focus:ring-2 focus:ring-ring"
						onClick={(e) => e.currentTarget.select()}
					/>
				</div>
			</details>
			<Button
				variant="outline"
				onClick={handleShare}
				className="js-only"
				aria-label={`Share ${title}`}
			>
				<Icons.share className="h-4 w-4" />
			</Button>
		</>
	);
}
