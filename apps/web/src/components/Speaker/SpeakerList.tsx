import { Link } from "@tanstack/react-router";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { EmptyStateCard } from "~/components/shared/EmptyStateCard";
import { LoadingState } from "~/components/shared/LoadingState";
import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { useIsClient } from "~/hooks/use-is-client";
import { useWindowSize } from "~/hooks/use-window-size";
import type { Person } from "~/types/fosdem";

type SpeakerListProps = {
	persons: Person[];
	year: number;
	initialQuery?: string;
};

export function SpeakerList({
	persons,
	year,
	initialQuery = "",
}: SpeakerListProps) {
	const isClient = useIsClient();

	if (!isClient) {
		return (
			<SpeakerListStatic
				persons={persons}
				year={year}
				initialQuery={initialQuery}
			/>
		);
	}

	return (
		<SpeakerListClient
			persons={persons}
			year={year}
			initialQuery={initialQuery}
		/>
	);
}

function SpeakerListClient({
	persons,
	year,
	initialQuery,
}: Required<SpeakerListProps>) {
	const [search, setSearch] = useState(initialQuery);
	const deferredSearch = useDeferredValue(search);
	const parentRef = useRef<HTMLDivElement>(null);
	const { width } = useWindowSize();
	const columnCount = useMemo(() => {
		if (width >= 1280) return 4;
		if (width >= 1024) return 3;
		if (width >= 640) return 2;
		return 1;
	}, [width]);

	useEffect(() => {
		setSearch(initialQuery);
	}, [initialQuery]);

	const filteredPersons = useMemo(() => {
		const query = deferredSearch.toLowerCase().trim();
		const list = query
			? persons.filter((p) => p.name.toLowerCase().includes(query))
			: [...persons];

		return list.sort((a, b) => a.name.localeCompare(b.name));
	}, [persons, deferredSearch]);

	const rows = useMemo(() => {
		const result = [];
		for (let i = 0; i < filteredPersons.length; i += columnCount) {
			result.push(filteredPersons.slice(i, i + columnCount));
		}
		return result;
	}, [filteredPersons, columnCount]);

	const rowVirtualizer = useVirtualizer({
		count: rows.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 74,
		overscan: 5,
	});

	return (
		<div className="space-y-6">
			<div className="max-w-sm">
				<label htmlFor="speaker-search" className="text-sm font-medium">
					Search speakers
				</label>
				<Input
					placeholder="Enter a name to search..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="bg-background shadow-sm"
					id="speaker-search"
				/>
				{deferredSearch !== search && (
					<div className="absolute top-0 right-0 h-full flex items-center pr-3 pointer-events-none">
						<LoadingState type="spinner" size="sm" variant="inline" />
					</div>
				)}
			</div>

			{filteredPersons.length > 0 ? (
				<div
					ref={parentRef}
					className="h-[calc(100vh-250px)] overflow-auto scrollbar-hide"
					style={{ contain: "strict" }}
				>
					<div
						style={{
							height: `${rowVirtualizer.getTotalSize()}px`,
							width: "100%",
							position: "relative",
						}}
					>
						{rowVirtualizer.getVirtualItems().map((virtualRow) => (
							<div
								key={virtualRow.key}
								className="grid gap-4"
								ref={rowVirtualizer.measureElement}
								style={{
									position: "absolute",
									top: 0,
									left: 0,
									width: "100%",
									height: `${virtualRow.size}px`,
									transform: `translateY(${virtualRow.start}px)`,
									gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
								}}
							>
								{rows[virtualRow.index].map((person) => (
									<Link
										key={person.id}
										to="/speakers/$slug"
										params={{ slug: person.slug || person.id }}
										search={{
											year,
											day: undefined,
											sortFavourites: undefined,
										}}
										className="group no-underline h-fit"
									>
										<Card className="transition-all duration-200 group-hover:border-primary/50 group-hover:shadow-md bg-card/40 backdrop-blur-sm">
											<CardContent className="p-4 flex items-center gap-4 text-foreground">
												<div className="flex-1 min-w-0">
													<div className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
														{person.name}
													</div>
												</div>
											</CardContent>
										</Card>
									</Link>
								))}
							</div>
						))}
					</div>
				</div>
			) : (
				<EmptyStateCard
					title="No speakers found"
					description="Adjust filters or pick another day to see more items."
					className="my-4"
				/>
			)}
		</div>
	);
}

function SpeakerListStatic({
	persons,
	year,
	initialQuery,
}: Required<SpeakerListProps>) {
	const normalizedQuery = initialQuery.toLowerCase().trim();
	const filteredPersons = normalizedQuery
		? persons.filter((person) =>
				person.name.toLowerCase().includes(normalizedQuery),
			)
		: [...persons];

	const sortedPersons = filteredPersons.sort((a, b) =>
		a.name.localeCompare(b.name),
	);

	return (
		<div className="space-y-6">
			<form method="GET" action="/speakers" className="max-w-sm space-y-1">
				<label htmlFor="speaker-search" className="text-sm font-medium">
					Search speakers
				</label>
				<Input
					id="speaker-search"
					name="q"
					defaultValue={initialQuery}
					placeholder="Enter a name and press enter to search..."
					className="bg-background shadow-sm"
				/>
				<input type="hidden" name="year" value={year} />
			</form>

			{sortedPersons.length > 0 ? (
				<div
					className="h-[calc(100vh-250px)] overflow-auto scrollbar-hide"
					style={{ contain: "strict" }}
				>
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{sortedPersons.map((person) => (
							<Link
								key={person.id}
								to="/speakers/$slug"
								params={{ slug: person.slug || person.id }}
								search={{ year, day: undefined, sortFavourites: undefined }}
								className="group no-underline"
							>
								<Card className="transition-all duration-200 group-hover:border-primary/50 group-hover:shadow-md bg-card/40 backdrop-blur-sm">
									<CardContent className="p-4 flex items-center gap-4 text-foreground">
										<div className="flex-1 min-w-0">
											<div className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
												{person.name}
											</div>
										</div>
									</CardContent>
								</Card>
							</Link>
						))}
					</div>
				</div>
			) : (
				<EmptyStateCard
					title="No speakers found"
					description="Adjust filters or pick another day to see more items."
					className="my-4"
				/>
			)}
		</div>
	);
}
