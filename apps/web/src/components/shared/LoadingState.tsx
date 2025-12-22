import { Loader2 } from "lucide-react";

import { cn } from "~/lib/utils";
import { Skeleton } from "~/components/ui/skeleton";

type LoadingStateProps = {
	type?: "spinner" | "skeleton" | "shimmer";
	message?: string;
	className?: string;
	size?: "sm" | "md" | "lg";
	variant?: "inline" | "centered" | "full";
};

export function LoadingState({
	type = "spinner",
	message,
	className,
	size = "md",
	variant = "centered",
}: LoadingStateProps) {
	const sizeClasses = {
		sm: "h-4 w-4",
		md: "h-6 w-6", 
		lg: "h-8 w-8",
	};

	const variantClasses = {
		inline: "inline-flex items-center gap-2",
		centered: "flex flex-col items-center justify-center gap-2",
		full: "w-full h-full flex flex-col items-center justify-center gap-2",
	};

	const containerClass = cn(variantClasses[variant], className);

	switch (type) {
		case "spinner":
			return (
				<div className={containerClass}>
					<Loader2 className={cn("animate-spin", sizeClasses[size])} />
					{message && <p className="text-sm text-muted-foreground">{message}</p>}
				</div>
			);

		case "skeleton":
			if (variant === "inline") {
				return (
					<div className={containerClass}>
						<Skeleton className={cn(sizeClasses[size])} />
						{message && <p className="text-sm text-muted-foreground">{message}</p>}
					</div>
				);
			}
			
			return (
				<div className={containerClass}>
					<div className="w-full space-y-2">
						<Skeleton className={cn("w-full", size === "sm" ? "h-4" : size === "md" ? "h-6" : "h-8")} />
						{message && <Skeleton className="w-3/4 h-4" />}
					</div>
				</div>
			);

		case "shimmer":
			return (
				<div className={containerClass}>
					<div className="w-full space-y-2">
						<div className={cn("animate-pulse rounded-md bg-muted", size === "sm" ? "h-4" : size === "md" ? "h-6" : "h-8")} />
						{message && <div className="animate-pulse rounded-md bg-muted w-3/4 h-4" />}
					</div>
				</div>
			);

		default:
			return null;
	}
}
