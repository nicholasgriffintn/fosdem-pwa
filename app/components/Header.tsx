import { Link, useSearch } from "@tanstack/react-router";

import { Icons } from "~/components/Icons";
import { MainNav } from "~/components/MainNav";
import { NavSearch } from "~/components/NavSearch";
import { Button } from "./ui/button";
import { AvatarMenu } from "./UserMenu";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "~/components/ui/tooltip";
import { useAuth } from "~/hooks/use-auth";
import { Spinner } from "~/components/Spinner";
import { constants } from "~/constants";

export function Header() {
	const { year } = useSearch({ strict: false });
	const selectedYear = Number(year) || constants.DEFAULT_YEAR;

	const { user, loading } = useAuth();

	const navItems = [
		{
			title: "Home",
			href: "/",
			icon: <Icons.home className="h-4 w-4" />,
		},
		{
			title: "Live",
			href: "/live",
			// biome-ignore lint/a11y/useMediaCaption: <explanation>
			icon: <Icons.video className="h-4 w-4" />,
		},
		{
			title: "Bookmarks",
			href: "/bookmarks/",
			icon: <Icons.bookmark className="h-4 w-4" />,
		},
		{
			title: "Map",
			href: "/map",
			icon: <Icons.map className="h-4 w-4" />,
		},
	];

	return (
		<header className="sticky top-0 z-40 w-full border-b bg-background">
			<div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
				<MainNav title="FOSDEM PWA" items={navItems} />
				<div className="flex flex-1 items-center space-x-4 sm:justify-end">
					<nav className="hidden md:flex space-x-4">
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									{loading ? (
										<div className="h-7 w-7 flex items-center justify-center">
											<Spinner />
										</div>
									) : user ? (
										<AvatarMenu user={user} />
									) : (
										<Button
											variant="link"
											size="icon"
											className="h-7 w-7"
											asChild
										>
											<Link
												to="/signin"
												search={(prev) => ({
													...prev,
													year: prev.year || constants.DEFAULT_YEAR,
												})}
											>
												<Icons.login className="h-7 w-7" width="7" height="7" />
												<span className="sr-only">Sign In</span>
											</Link>
										</Button>
									)}
								</TooltipTrigger>
								<TooltipContent>
									<p>Sign in to save favourites</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</nav>
					<div className="flex-1 sm:grow-0">
						<NavSearch year={selectedYear} />
					</div>
				</div>
			</div>
		</header>
	);
}
