import { Link } from "@tanstack/react-router";

import { constants } from "~/constants";
import { Button } from "~/components/ui/button";
import { EmptyStateCard } from "~/components/EmptyStateCard";

export function NotFound() {
	return (
		<EmptyStateCard
			title="Page not found"
			description="The page you are looking for does not exist or has been moved."
			actions={
				<>
					<Button type="button" onClick={() => window.history.back()}>
						Go back
					</Button>
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
				</>
			}
		/>
	);
}
