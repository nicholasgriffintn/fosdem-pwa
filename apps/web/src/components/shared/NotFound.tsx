import { Link } from "@tanstack/react-router";

import { constants } from "~/constants";
import { Button } from "~/components/ui/button";
import { EmptyStateCard } from "~/components/shared/EmptyStateCard";
import { PageHeader } from "~/components/shared/PageHeader";
import { PageShell } from "~/components/shared/PageShell";

export function NotFound() {
	return (
		<PageShell maxWidth="none">
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
		</PageShell>
	);
}
