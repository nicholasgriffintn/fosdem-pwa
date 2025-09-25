import { Link } from "@tanstack/react-router";

import { cn } from "~/lib/utils";
import { constants } from "~/constants";
import { Alert, AlertTitle } from "~/components/ui/alert";

type PageHeaderProps = React.HTMLAttributes<HTMLDivElement> & {
	heading: string;
	subtitle?: string;
	text?: string;
	className?: string;
	children?: React.ReactNode;
	displayHeading?: boolean;
	breadcrumbs?: {
		title: string;
		href: string;
		search?: Record<string, string | number | string[] | number[]>;
	}[];
	metadata?: {
		text: string;
		href?: string;
	}[];
	year?: number;
};

export function PageHeader({
	heading,
	subtitle,
	text,
	className,
	children,
	displayHeading = true,
	breadcrumbs,
	metadata,
	year = constants.DEFAULT_YEAR,
}: PageHeaderProps) {
	return (
		<>
			{year && year !== constants.DEFAULT_YEAR && (
				<Alert variant="destructive" className="mb-4">
					<AlertTitle>
						<span>
							You are viewing the {year} edition of FOSDEM.{' '}
							<Link
								to="/"
								search={{ year: constants.DEFAULT_YEAR }}
							>
								Click here to view the {constants.DEFAULT_YEAR} edition
							</Link>
						</span>
					</AlertTitle>
				</Alert>
			)}
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
					{subtitle && (
						<p className="text-xl text-muted-foreground">{subtitle}</p>
					)}
					{metadata && (
						<p className="text-base text-muted-foreground">
							{metadata.map((meta, index) => (
								<span key={meta.text}>
									{meta.href ? (
										<Link
											to={meta.href}
											search={(prev) => ({ ...prev })}
										>
											{meta.text}
										</Link>
									) : (
										meta.text
									)}
									{index < metadata.length - 1 && " | "}
								</span>
							))}
						</p>
					)}
					{text && <p className="text-xl text-muted-foreground">{text}</p>}
				</div>
				{children && <div className="flex justify-end">{children}</div>}
			</div>
			{displayHeading && <div className="my-4" />}
		</>
	);
}
