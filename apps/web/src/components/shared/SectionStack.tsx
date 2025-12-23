import type { ReactNode } from "react";

import { cn } from "~/lib/utils";

type SectionStackProps = {
	children: ReactNode;
	className?: string;
};

export function SectionStack({ children, className }: SectionStackProps) {
	return <div className={cn("space-y-6 lg:space-y-8", className)}>{children}</div>;
}
