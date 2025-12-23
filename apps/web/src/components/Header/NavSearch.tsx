"use client";

import { useCallback, useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";

import { cn } from "~/lib/utils";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { useFosdemData } from "~/hooks/use-fosdem-data";
import { Spinner } from "~/components/Spinner";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Card } from "~/components/ui/card";
import { useIsClient } from "~/hooks/use-is-client";
import { buildEventLink, buildTrackLink, buildRoomLink, buildSearchLink } from "~/lib/link-builder";
import {
	type SearchResult,
	TRACK_SEARCH_KEYS,
	EVENT_SEARCH_KEYS,
	ROOM_SEARCH_KEYS,
	createSearchIndex,
	formatSearchResults,
} from "~/lib/search";

type NavSearchProps = {
	year: number;
} & React.HTMLAttributes<HTMLFormElement>;

export function NavSearch({ year, className, ...props }: NavSearchProps) {
	const { fosdemData, loading } = useFosdemData({ year });

	const isClient = useIsClient();

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

	const tracksIndex = useMemo(() => {
		if (!fosdemData) return null;
		return createSearchIndex(
			Object.values(fosdemData.tracks),
			TRACK_SEARCH_KEYS,
		);
	}, [fosdemData]);

	const eventsIndex = useMemo(() => {
		if (!fosdemData) return null;
		return createSearchIndex(
			Object.values(fosdemData.events),
			EVENT_SEARCH_KEYS,
		);
	}, [fosdemData]);

	const roomsIndex = useMemo(() => {
		if (!fosdemData) return null;
		return createSearchIndex(Object.values(fosdemData.rooms), ROOM_SEARCH_KEYS);
	}, [fosdemData]);

	const handleSearch = useCallback(
		(query: string) => {
			setInputValue(query);
			if (!query.trim() || !tracksIndex || !eventsIndex || !roomsIndex) {
				setSearchResults([]);
				return;
			}

			setIsSearching(true);
			setFocusedIndex(-1);

			const tracksResults = formatSearchResults(
				tracksIndex.search(query),
				"track",
				3,
			);
			const eventsResults = formatSearchResults(
				eventsIndex.search(query),
				"event",
				3,
			);
			const roomsResults = formatSearchResults(
				roomsIndex.search(query),
				"room",
				3,
			);

			const combinedResults = [
				...tracksResults,
				...eventsResults,
				...roomsResults,
			]
				.sort((a, b) => (a.score || 0) - (b.score || 0))
				.slice(0, 10);
			setSearchResults(combinedResults);
			setIsSearching(false);
		},
		[tracksIndex, eventsIndex, roomsIndex],
	);

	const handleResultClick = (result: SearchResult) => {
		switch (result.type) {
			case "track":
				navigate(buildTrackLink(result.item.id, {
					year,
					view: "list",
					sortFavourites: "false",
				}));
				break;
			case "event":
				navigate(buildEventLink(result.item.id, { year }));
				break;
			case "room":
				navigate(buildRoomLink(result.item.slug || result.item.id, {
					year,
					sortFavourites: "false",
				}));
				break;
		}
		setSearchResults([]);
		setInputValue("");
		setFocusedIndex(-1);
	};

	const goToSearchPage = useCallback(
		(query: string) => {
			const trimmed = query.trim();
			if (!trimmed) return;
			navigate(buildSearchLink({
				year,
				q: trimmed,
				type: "all"
			}));
		},
		[navigate, year],
	);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (!searchResults.length) {
			if (e.key === "Enter" && inputValue.trim()) {
				e.preventDefault();
				setFocusedIndex(-1);
				goToSearchPage(inputValue);
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
					setSearchResults([]);
					setFocusedIndex(-1);
					goToSearchPage(inputValue);
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
						role="option"
						aria-selected={focusedIndex === index}
						className={cn(
							"w-full text-left p-2 hover:bg-accent cursor-pointer focus:outline-none focus:bg-accent",
							focusedIndex === index && "bg-accent",
						)}
						onClick={() => handleResultClick(result)}
						onKeyDown={handleKeyDown}
					>
						<div className="flex items-start justify-between gap-2">
							<div className="font-medium">{result.item.name}</div>
							<Badge variant="outline" className="text-[10px] uppercase">
								Track
							</Badge>
						</div>
						<div className="text-xs text-muted-foreground">
							{[result.item.type, result.item.room]
								.filter(Boolean)
								.join(" • ")}
						</div>
					</button>
				);
			case "event":
				return (
					<button
						ref={setRef}
						type="button"
						role="option"
						aria-selected={focusedIndex === index}
						className={cn(
							"w-full text-left p-2 hover:bg-accent cursor-pointer focus:outline-none focus:bg-accent",
							focusedIndex === index && "bg-accent",
						)}
						onClick={() => handleResultClick(result)}
						onKeyDown={handleKeyDown}
					>
						<div className="flex items-start justify-between gap-2">
							<div className="font-medium">{result.item.title}</div>
							<Badge variant="outline" className="text-[10px] uppercase">
								Event
							</Badge>
						</div>
						<div className="text-xs text-muted-foreground">
							{[
								result.item.track || result.item.trackKey,
								result.item.startTime,
								result.item.room,
							]
								.filter(Boolean)
								.join(" • ")}
						</div>
						{result.item.persons?.length ? (
							<div className="text-[11px] text-muted-foreground line-clamp-1">
								{result.item.persons.join(", ")}
							</div>
						) : null}
					</button>
				);
			case "room":
				return (
					<button
						ref={setRef}
						type="button"
						role="option"
						aria-selected={focusedIndex === index}
						className={cn(
							"w-full text-left p-2 hover:bg-accent cursor-pointer focus:outline-none focus:bg-accent",
							focusedIndex === index && "bg-accent",
						)}
						onClick={() => handleResultClick(result)}
						onKeyDown={handleKeyDown}
					>
						<div className="flex items-start justify-between gap-2">
							<div className="font-medium">{result.item.name}</div>
							<Badge variant="outline" className="text-[10px] uppercase">
								Room
							</Badge>
						</div>
						<div className="text-xs text-muted-foreground">
							{[
								"Building",
								result.item.buildingId || result.item.building?.id,
							]
								.filter(Boolean)
								.join(" ")}
						</div>
					</button>
				);
		}
	};

	return (
		<div ref={containerRef} className={cn("relative w-full", className)}>
			<form
				action="/search"
				method="GET"
				className="relative w-full"
				{...props}
				onSubmit={(e) => {
					if (inputValue.trim()) {
						e.preventDefault();
						goToSearchPage(inputValue);
					}
				}}
			>
				<input type="hidden" name="year" value={year} />
				<input type="hidden" name="type" value="all" />
				<Input
					id="search"
					ref={searchInputRef}
					name="q"
					type="search"
					value={inputValue}
					placeholder="Search events..."
					aria-label="Search events"
					className="h-8 w-full sm:w-64 sm:pr-12"
					onChange={(e) => handleSearch(e.target.value)}
					onKeyDown={handleKeyDown}
				/>
				<kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 sm:flex">
					{(isClient && (loading || isSearching)) && <Spinner className="h-3 w-3" />}
					<span className="text-xs">⌘</span>K
				</kbd>
			</form>

			{searchResults.length > 0 && (
				<Card
					className="absolute top-full mt-2 right-0 w-full sm:w-96 z-50 overflow-hidden"
					role="listbox"
					aria-label="Search suggestions"
				>
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
					{inputValue.trim() && (
						<div className="flex items-center justify-between gap-3 border-t bg-muted/40 px-3 py-2">
							{focusedIndex === -1 && (
								<p className="text-xs text-muted-foreground">
									Press Enter to search all results
								</p>
							)}
							<Button
								size="sm"
								variant="ghost"
								onClick={() => goToSearchPage(inputValue)}
							>
								View all
							</Button>
						</div>
					)}
				</Card>
			)}
		</div>
	);
}
