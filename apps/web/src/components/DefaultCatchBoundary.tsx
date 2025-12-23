import {
	type ErrorComponentProps,
	Link,
	rootRouteId,
	useMatch,
	useRouter,
} from "@tanstack/react-router";
import { useEffect } from "react";

import { Button } from "~/components/ui/button";
import { constants } from "~/constants";
import { EmptyStateCard } from "~/components/EmptyStateCard";
import { PageHeader } from "~/components/PageHeader";

export function DefaultCatchBoundary({ error }: Readonly<ErrorComponentProps>) {
	const router = useRouter();
	const isRoot = useMatch({
		strict: false,
		select: (state) => state.id === rootRouteId,
	});

	useEffect(() => {
		console.error("Error boundary caught:", {
			message: (error as Error)?.message,
			stack: (error as Error)?.stack,
			error,
		});

		// TODO: Send error to monitoring service (e.g., Sentry)
		// if (typeof window !== "undefined" && window.Sentry) {
		//   window.Sentry.captureException(error);
		// }
	}, [error]);

	const message =
		(error as Error)?.message ||
		"An unexpected error occurred. Please try again.";

	return (
		<div className="min-h-screen">
			<div className="relative py-6 lg:py-10">
				<PageHeader heading="Something went wrong" />
				<EmptyStateCard
					title="Whoops!"
					description={<p className="text-sm text-muted-foreground">{message}</p>}
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
											year: prev.year || constants.DEFAULT_YEAR,
										})}
									>
										Home
									</Link>
								</Button>
							) : (
								<Button
									variant="secondary"
									type="button"
									onClick={() => {
										window.history.back();
									}}
								>
									Go Back
								</Button>
							)}
						</>
					}
				/>
			</div>
		</div>
	);
}
