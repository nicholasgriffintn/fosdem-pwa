import { Link } from "@tanstack/react-router";

import { cn } from "~/lib/utils";

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
	heading: string;
	text?: string;
	className?: string;
	children?: React.ReactNode;
	displayHeading?: boolean;
	breadcrumbs?: {
		title: string;
		href: string;
		search?: Record<string, string | number | string[] | number[]>;
	}[];
	metadata?: string[]
}

export function PageHeader({
	heading,
	text,
	className,
	children,
	displayHeading = true,
	breadcrumbs,
	metadata,
}: PageHeaderProps) {
	return (
		<>
			{breadcrumbs && breadcrumbs.length > 0 && (
				<ul className="flex flex-row gap-2 mb-4 text-sm text-muted-foreground">
					{breadcrumbs.map((breadcrumb, index) => (
						<li key={breadcrumb.href}>
							<Link
								to={breadcrumb.href}
								search={(prev) => ({ ...prev, ...breadcrumb.search })}
								className="no-underline"
							>
								{breadcrumb.title}
							</Link>
							{index < breadcrumbs.length - 1 && (
								<span className="text-muted-foreground">{" / "}</span>
							)}
						</li>
					))}
				</ul>
			)}
			<div className="flex flex-col gap-4 md:flex-row md:justify-between">
				<div className={cn("space-y-4", className)}>
					<h1
						className={cn(
							"inline-block font-heading",
							displayHeading ? "text-4xl lg:text-5xl" : "sr-only",
						)}
					>
						{heading}
					</h1>
					{metadata && <p className="text-base text-muted-foreground">{metadata.join(" | ")}</p>}
					{text && <p className="text-xl text-muted-foreground">{text}</p>}
				</div>
				{children && <div className="flex justify-end">{children}</div>}
			</div>
			{displayHeading && <div className="my-4" />}
		</>
	);
}
