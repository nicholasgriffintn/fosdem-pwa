import * as React from "react";
import { Icons } from "~/components/shared/Icons";
import { cn } from "~/lib/utils";

export type SelectOption = {
	label: string;
	value: string;
	disabled?: boolean;
};

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
	options: SelectOption[];
	onValueChange?: (value: string) => void;
	placeholder?: string;
};

export function Select({
	options,
	className,
	onValueChange,
	onChange,
	placeholder,
	value,
	defaultValue,
	...props
}: SelectProps) {
	const selectValueProps =
		value !== undefined
			? { value }
			: { defaultValue: defaultValue ?? (placeholder ? "" : undefined) };

	return (
		<div className="relative">
			<select
				{...props}
				{...selectValueProps}
				onChange={(event) => {
					onChange?.(event);
					onValueChange?.(event.currentTarget.value);
				}}
				className={cn(
					"h-10 w-full appearance-none rounded-md border border-input bg-background px-3 pr-8 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
					className,
				)}
			>
				{placeholder && (
					<option value="" disabled hidden>
						{placeholder}
					</option>
				)}
				{options.map((option) => (
					<option
						key={option.value}
						value={option.value}
						disabled={option.disabled}
					>
						{option.label}
					</option>
				))}
			</select>
			<Icons.chevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
		</div>
	);
}
