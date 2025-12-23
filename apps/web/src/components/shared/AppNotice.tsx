"use client";

import { Icons } from "~/components/shared/Icons";

export function AppNotice() {
	return (
		<div className="bg-amber-50 border-b border-amber-200 text-amber-900 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-50">
			<div className="container flex flex-col gap-3 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-start gap-3 sm:items-center">
					<Icons.alertTriangle className="h-5 w-5 flex-shrink-0 text-amber-500 dark:text-amber-200 sm:h-4 sm:w-4" />
					<p>
						<span className="font-medium">Everything is working fine actually.</span>{" "}
						I'm just leaving the code here in case I need it again.
					</p>
				</div>
			</div>
		</div>
	);
}
