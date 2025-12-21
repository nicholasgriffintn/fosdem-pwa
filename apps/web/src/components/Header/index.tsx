import { Link, useSearch } from "@tanstack/react-router";
import { useIsClient } from "~/hooks/use-is-client";

import { Icons } from "~/components/Icons";
import { MainNav } from "~/components/Header/MainNav";
import { NavSearch } from "~/components/Header/NavSearch";
import { Button } from "~/components/ui/button";
import { AvatarMenu } from "~/components/Header/UserMenu";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "~/components/ui/tooltip";
import { useAuth } from "~/hooks/use-auth";
import { Spinner } from "~/components/Spinner";
import { constants } from "~/constants";
import { cn } from "../../lib/utils";

export function Header() {
	const { year } = useSearch({ strict: false });
	const selectedYear = Number(year) || constants.DEFAULT_YEAR;

	const { user, loading } = useAuth();

	const isClient = useIsClient();

	const navItems = [
		{
			title: "Schedule",
			href: "/",
			icon: <Icons.calendar className="h-4 w-4" />,
		},
		{
			title: "Live",
			href: "/live",
			icon: <Icons.video className="h-4 w-4" />,
		},
		{
			title: "Speakers",
			href: "/speakers",
			icon: <Icons.users className="h-4 w-4" />,
		},
		{
			title: "Rooms",
			href: "/rooms",
			icon: <Icons.building className="h-4 w-4" />,
		},
		{
			title: "Bookmarks",
			href: "/bookmarks",
			icon: <Icons.bookmark className="h-4 w-4" />,
		},
		{
			title: "Map",
			href: "/map",
			icon: <Icons.map className="h-4 w-4" />,
		},
	];

	return (
		<header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
			<div className="container flex h-16 items-center justify-between gap-4">
				<MainNav title="FOSDEM PWA" items={navItems} />
				<div className="flex items-center justify-end gap-3">
					<nav className="hidden md:flex items-center gap-2 shrink-0">
						{user?.id ? (
							<AvatarMenu user={user} />
						) : loading && isClient ? (
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
										<div className="h-7 w-7 flex items-center justify-center">
											<Spinner />
										</div>
										</TooltipTrigger>
										<TooltipContent>
											<p>Loading...</p>
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							) : (
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger asChild>
										<Button
											variant="link"
											size="sm"
											className={cn(
												"h-8 gap-2 px-3 text-muted-foreground no-underline whitespace-nowrap",
											)}
											asChild
										>
											<Link
												to="/signin"
												search={(prev: Record<string, unknown>) => ({
													year: (prev.year as number) || constants.DEFAULT_YEAR,
												})}
											>
												<Icons.login className="h-4 w-4" />
												<span>Sign In</span>
											</Link>
												</Button>
											</TooltipTrigger>
											<TooltipContent>
												<p>Sign in to save favourites</p>
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
						)}
					</nav>
					<NavSearch year={selectedYear} />
				</div>
			</div>
		</header>
	);
}
