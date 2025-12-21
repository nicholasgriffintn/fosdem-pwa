import { Link } from "@tanstack/react-router";

import { constants } from "~/constants";
import { Button } from "~/components/ui/button";

export function NotFound() {
	return (
		<div className="space-y-2 p-2">
			<p>The page you are looking for does not exist.</p>
			<p className="flex flex-wrap items-center gap-2">
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
			</p>
		</div>
	);
}
