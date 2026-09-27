import { createRootRoute } from "@tanstack/react-router";

import { DirectoryDocument } from "../components/DirectoryDocument";

export const Route = createRootRoute({
	component: DirectoryDocument,
	notFoundComponent: () => (
		<section className="py-8">
			<h1 className="text-2xl font-heading">Page not found</h1>
			<a className="underline" href="/">
				Browse conferences
			</a>
		</section>
	),
});
