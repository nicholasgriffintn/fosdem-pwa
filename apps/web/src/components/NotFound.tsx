import { Link } from "@tanstack/react-router";

import { constants } from "~/constants";
import { Button } from "~/components/ui/button";
import { EmptyStateCard } from "~/components/EmptyStateCard";
import { PageHeader } from "~/components/PageHeader";

export function NotFound() {
	return (
		<div className="min-h-screen">
			<div className="relative py-6 lg:py-10">
				<PageHeader heading="Page not found" />
				<EmptyStateCard
					title="Whoops!"
					description="The page you are looking for does not exist or has been moved."
					actions={
						<>
							<Button
								type="button"
								onClick={() => window.history.back()}
								aria-label="Go back to previous page"
							>
								Go back
							</Button>
							<Button asChild variant="secondary">
								<Link
									to="/"
									search={(prev) => ({
										year: prev.year || constants.DEFAULT_YEAR,
									})}
									className="no-underline hover:underline"
								>
									Home
								</Link>
							</Button>
						</>
					}
				/>
			</div>
		</div>
	);
}
