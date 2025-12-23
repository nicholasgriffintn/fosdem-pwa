"use client";

import { useRouter, useSearch } from "@tanstack/react-router";

import { constants } from "~/constants";
import { toast } from "~/hooks/use-toast";
import { Select } from "~/components/ui/select";
import { buildHomeLink } from "~/lib/link-builder";

export function YearSelector() {
	const router = useRouter();
	const { year } = useSearch({ strict: false });
	const selectedYear = year || constants.DEFAULT_YEAR;

	const handleYearChange = (year: number) => {
		router.navigate(buildHomeLink({ year }));

		toast({
			title: "Year changed",
			description: `You are now viewing the ${year} edition of FOSDEM.`,
		});
	};

	const yearOptions = constants.AVAILABLE_YEARS.map((year) => ({
		label: year.toString(),
		value: year.toString(),
	}));

	return (
		<div className="flex items-center gap-2">
			<label htmlFor="year-select">Year</label>
			<form method="GET" action="/" className="flex items-center gap-2">
				<Select
					name="year"
					id="year-select"
					value={selectedYear.toString()}
					onValueChange={(value) => handleYearChange(Number(value))}
					options={yearOptions}
					className="h-9 w-24"
				/>
				<button
					type="submit"
					className="no-js-only h-9 rounded-md border border-input bg-background px-3 text-sm hover:bg-accent"
					aria-label="Navigate to selected year"
				>
					Go
				</button>
			</form>
		</div>
	);
}
