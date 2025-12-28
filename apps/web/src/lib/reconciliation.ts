import type { QueryClient } from "@tanstack/react-query";

export interface ReconciliationOptions<TLocal, TServer> {
	localItems: TLocal[];
	serverItems: TServer[];
	getSlug: (item: TLocal | TServer) => string;
	createLocalItem: (serverItem: TServer, skipSync: boolean) => Promise<void>;
	updateLocalItem: (localItem: TLocal, serverItem: TServer, skipSync: boolean) => Promise<void>;
	needsUpdate: (localItem: TLocal, serverItem: TServer) => boolean;
	getServerId: (item: TLocal | TServer) => string | number | undefined;
	queryClient: QueryClient;
	localQueryKey: unknown[];
}

export async function reconcileItems<TLocal, TServer>(
	options: ReconciliationOptions<TLocal, TServer>,
): Promise<void> {
	const {
		localItems,
		serverItems,
		getSlug,
		createLocalItem,
		updateLocalItem,
		needsUpdate,
		getServerId,
		queryClient,
		localQueryKey,
	} = options;

	const localBySlug = new Map(localItems.map((item) => [getSlug(item), item]));

	const operations = serverItems.map(async (serverItem) => {
		const slug = getSlug(serverItem);
		const existingLocal = localBySlug.get(slug);

		try {
			if (!existingLocal) {
				await createLocalItem(serverItem, true);
				return { status: "created" as const };
			}

			if (needsUpdate(existingLocal, serverItem)) {
				await updateLocalItem(existingLocal, serverItem, true);
				return { status: "updated" as const };
			}

			return { status: "unchanged" as const };
		} catch (error) {
			console.error(`Failed to reconcile item ${slug}:`, error);
			return { status: "failed" as const, error };
		}
	});

	if (operations.length > 0) {
		const results = await Promise.allSettled(operations);
		const failures = results.filter(
			(r) => r.status === "rejected" || (r.status === "fulfilled" && r.value?.status === "failed")
		);

		if (failures.length > 0) {
			console.warn(
				`Reconciliation completed with ${failures.length} failures out of ${results.length} operations`
			);
		}

		await queryClient.invalidateQueries({
			queryKey: localQueryKey,
		});
	}
}
