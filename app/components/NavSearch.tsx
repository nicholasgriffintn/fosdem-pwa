"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import Fuse from "fuse.js";
import { useNavigate } from "@tanstack/react-router";

import { cn } from "~/lib/utils";
import { Input } from "~/components/ui/input";
import { useFosdemData } from "~/hooks/use-fosdem-data";
import { Spinner } from "~/components/Spinner";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Card } from "~/components/ui/card";

interface SearchResult {
	type: "type" | "track" | "event";
	item: any;
}

interface DocsSearchProps extends React.HTMLAttributes<HTMLFormElement> {
	year: number;
}

export function NavSearch({ year, className, ...props }: DocsSearchProps) {
	const { fosdemData, loading } = useFosdemData({ year });

	const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [focusedIndex, setFocusedIndex] = useState(-1);
	const [inputValue, setInputValue] = useState("");
	const navigate = useNavigate();
	const searchInputRef = useRef<HTMLInputElement>(null);
	const resultsRef = useRef<(HTMLButtonElement | null)[]>([]);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		resultsRef.current = resultsRef.current.slice(0, searchResults.length);
	}, [searchResults]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === "k") {
				e.preventDefault();
				searchInputRef.current?.focus();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setSearchResults([]);
				setFocusedIndex(-1);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleSearch = useCallback(
		(query: string) => {
			setInputValue(query);
			if (!fosdemData || !query.trim()) {
				setSearchResults([]);
				return;
			}

			setIsSearching(true);
			setFocusedIndex(-1);

			const tracksFuse = new Fuse(Object.values(fosdemData.tracks), {
				keys: ["name", "id", "type"],
				threshold: 0.3,
			});

			const eventsFuse = new Fuse(Object.values(fosdemData.events), {
				keys: ["title", "track", "persons", "abstract"],
				threshold: 0.3,
			});

			const tracksResults = tracksFuse.search(query).map((result) => ({
				type: "track" as const,
				item: result.item,
			}));

			const eventsResults = eventsFuse.search(query).map((result) => ({
				type: "event" as const,
				item: result.item,
			}));

			const combinedResults = [...tracksResults, ...eventsResults].slice(0, 10);
			setSearchResults(combinedResults);
			setIsSearching(false);
		},
		[fosdemData],
	);

	const handleResultClick = (result: SearchResult) => {
		switch (result.type) {
			case "track":
				navigate({
					to: "/track/$slug",
					params: { slug: result.item.id },
					search: { year },
				});
				break;
			case "event":
				navigate({
					to: "/event/$slug",
					params: { slug: result.item.id },
					search: { year, test: false },
				});
				break;
		}
		setSearchResults([]);
		setInputValue("");
		setFocusedIndex(-1);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (!searchResults.length) {
			if (e.key === "Enter" && inputValue.trim()) {
				e.preventDefault();
				setFocusedIndex(-1);
				navigate({
					to: "/search",
					search: { year, q: inputValue.trim() },
				});
				return;
			}
			return;
		}

		if (e.currentTarget === searchInputRef.current && e.key === "ArrowDown") {
			e.preventDefault();
			setFocusedIndex(0);
			resultsRef.current[0]?.focus();
			return;
		}

		if (focusedIndex === 0 && e.key === "ArrowUp") {
			e.preventDefault();
			setFocusedIndex(-1);
			searchInputRef.current?.focus();
			return;
		}

		switch (e.key) {
			case "ArrowDown":
				e.preventDefault();
				setFocusedIndex((prev) => {
					const next = prev + 1 >= searchResults.length ? 0 : prev + 1;
					resultsRef.current[next]?.focus();
					return next;
				});
				break;
			case "ArrowUp":
				e.preventDefault();
				setFocusedIndex((prev) => {
					const next = prev - 1 < 0 ? searchResults.length - 1 : prev - 1;
					resultsRef.current[next]?.focus();
					return next;
				});
				break;
			case "Escape":
				e.preventDefault();
				setSearchResults([]);
				setFocusedIndex(-1);
				searchInputRef.current?.blur();
				break;
			case "Enter":
				if (focusedIndex >= 0 && focusedIndex < searchResults.length) {
					e.preventDefault();
					handleResultClick(searchResults[focusedIndex]);
				} else if (inputValue.trim()) {
					e.preventDefault();
					navigate({
						to: "/search",
						search: { year, q: inputValue.trim() },
					});
				}
				break;
		}
	};

	const renderSearchResult = (result: SearchResult, index: number) => {
		const setRef = (el: HTMLButtonElement | null) => {
			resultsRef.current[index] = el;
		};

		switch (result.type) {
			case "track":
				return (
					<button
						ref={setRef}
						type="button"
						className={cn(
							"w-full text-left p-2 hover:bg-accent cursor-pointer focus:outline-none focus:bg-accent",
							focusedIndex === index && "bg-accent",
						)}
						onClick={() => handleResultClick(result)}
						onKeyDown={handleKeyDown}
					>
						<div className="font-medium">{result.item.name}</div>
						<div className="text-sm text-muted-foreground">
							Track • {result.item.type}
						</div>
					</button>
				);
			case "event":
				return (
					<button
						ref={setRef}
						type="button"
						className={cn(
							"w-full text-left p-2 hover:bg-accent cursor-pointer focus:outline-none focus:bg-accent",
							focusedIndex === index && "bg-accent",
						)}
						onClick={() => handleResultClick(result)}
						onKeyDown={handleKeyDown}
					>
						<div className="font-medium">{result.item.title}</div>
						<div className="text-sm text-muted-foreground">
							Event • {result.item.track} • {result.item.persons?.join(", ")}
						</div>
					</button>
				);
		}
	};

	return (
		<div ref={containerRef} className={cn("relative w-full", className)}>
			<form
				className="relative w-full"
				{...props}
				onSubmit={(e) => e.preventDefault()}
			>
				<Input
					ref={searchInputRef}
					type="search"
					value={inputValue}
					placeholder="Search events..."
					className="h-8 w-full sm:w-64 sm:pr-12"
					onChange={(e) => handleSearch(e.target.value)}
					onKeyDown={handleKeyDown}
				/>
				<kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 sm:flex">
					{(loading || isSearching) && <Spinner className="h-3 w-3" />}
					<span className="text-xs">⌘</span>K
				</kbd>
			</form>

			{searchResults.length > 0 && (
				<Card className="absolute top-full mt-2 right-0 w-full sm:w-96 z-50">
					<ScrollArea className="h-[300px]">
						<div className="p-2">
							{searchResults.map((result, index) => (
								<div
									key={`${result.type}-${result.item.id || result.item.name}`}
									className="border-b last:border-0"
								>
									{renderSearchResult(result, index)}
								</div>
							))}
						</div>
					</ScrollArea>
				</Card>
			)}
		</div>
	);
}
