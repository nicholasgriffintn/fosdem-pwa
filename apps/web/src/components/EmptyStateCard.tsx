import type { ReactNode } from "react";

import { cn } from "~/lib/utils";

type EmptyStateCardProps = {
	title: string;
	description?: ReactNode;
	actions?: ReactNode;
	className?: string;
};

/**
 * Consistent full-width empty/error card used for not-found, errors, and blanks.
 */
export function EmptyStateCard({
	title,
	description,
	actions,
	className,
}: EmptyStateCardProps) {
	return (
		<div className={cn("w-full", className)}>
			<div className="w-full rounded-xl border-2 border-dotted border-border bg-muted/30 p-6 text-center shadow-sm md:p-8">
				<div className="mx-auto flex max-w-2xl flex-col items-center gap-3">
					<h2 className="text-xl font-semibold text-foreground">{title}</h2>
					{description && (
						<div className="text-sm text-muted-foreground">{description}</div>
					)}
					{actions && (
						<div className="flex flex-wrap items-center justify-center gap-2">
							{actions}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
