import {
	type ErrorComponentProps,
	Link,
	rootRouteId,
	useMatch,
	useRouter,
} from "@tanstack/react-router";

import { Button } from "~/components/ui/button";
import { constants } from "~/constants";
import { EmptyStateCard } from "~/components/EmptyStateCard";

export function DefaultCatchBoundary({ error }: Readonly<ErrorComponentProps>) {
	const router = useRouter();
	const isRoot = useMatch({
		strict: false,
		select: (state) => state.id === rootRouteId,
	});

	console.error(error);

	const message =
		(error as Error)?.message || "An unexpected error occurred. Please try again.";

	return (
		<div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-6 p-4">
			<EmptyStateCard
				title="Something went wrong"
				description={
					<p className="text-sm text-muted-foreground">{message}</p>
				}
				actions={
					<>
						<Button
							type="button"
							onClick={() => {
								router.invalidate();
							}}
						>
							Try Again
						</Button>
						{isRoot ? (
							<Button asChild variant="secondary">
								<Link
									to="/"
									search={(prev) => ({
										...prev,
										year: prev.year || constants.DEFAULT_YEAR,
									})}
								>
									Home
								</Link>
							</Button>
						) : (
							<Button asChild variant="secondary">
								<Link
									to="/"
									search={(prev) => ({
										...prev,
										year: prev.year || constants.DEFAULT_YEAR,
									})}
									onClick={(e) => {
										e.preventDefault();
										window.history.back();
									}}
								>
									Go Back
								</Link>
							</Button>
						)}
					</>
				}
			/>
		</div>
	);
}
