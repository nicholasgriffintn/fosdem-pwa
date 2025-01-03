import { createFileRoute, Navigate } from "@tanstack/react-router";

import { PageHeader } from "~/components/PageHeader";

export const Route = createFileRoute("/offline/")({
	component: OfflinePage,
	head: () => ({
		meta: [
			{
				title: "Offline | FOSDEM PWA",
				description:
					"You appear to be offline and we couldn't load the data from the cache.",
			},
		],
	}),
});

function OfflinePage() {
	return (
		<div className="min-h-screen">
			<div className="relative py-6 lg:py-10">
				<PageHeader
					heading="Offline"
					text="You appear to be offline and we couldn't load the data from the cache."
				/>
				<button
					type="button"
					onClick={() => window.location.reload()}
					className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
				>
					Try Again
				</button>
			</div>
		</div>
	);
}
