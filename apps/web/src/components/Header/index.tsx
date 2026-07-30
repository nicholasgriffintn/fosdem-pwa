import { Link, useSearch } from "@tanstack/react-router";
import { HeaderSearch } from "~/components/Header/HeaderSearch";
import { MainNav } from "~/components/Header/MainNav";
import { AvatarMenu } from "~/components/Header/UserMenu";
import { Icons } from "~/components/shared/Icons";
import { LoadingState } from "~/components/shared/LoadingState";
import { navItems } from "~/components/shared/NavItems";
import { Spinner } from "~/components/shared/Spinner";
import { Button } from "~/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "~/components/ui/tooltip";
import { constants } from "~/constants";
import { useAuthSnapshot } from "~/contexts/AuthSnapshotContext";
import { useAuth } from "~/hooks/use-auth";
import { useIsClient } from "~/hooks/use-is-client";
import { cn } from "~/lib/utils";

export function Header() {
	const { year } = useSearch({ strict: false });
	const selectedYear = Number(year) || constants.DEFAULT_YEAR;

	const { user, loading, logout } = useAuth();
	const { user: serverUser } = useAuthSnapshot();

	const isClient = useIsClient();
	const resolvedUser = isClient ? user : serverUser;
	const resolvedLoading = isClient ? loading : false;

	return (
		<header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
			<div className="container flex h-14 items-center justify-between gap-3">
				<MainNav title="FOSDEM PWA" items={navItems} year={selectedYear} />
				<div className="flex flex-1 min-w-0 items-center justify-end gap-3">
					<div className="hidden lg:flex items-center gap-2 shrink-0">
						{resolvedUser?.id ? (
							<AvatarMenu
								onSignOut={() => logout()}
								year={selectedYear}
								user={resolvedUser}
							/>
						) : resolvedLoading ? (
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<div className="h-7 w-7 flex items-center justify-center">
											<Spinner />
										</div>
									</TooltipTrigger>
									<TooltipContent>
										<LoadingState type="spinner" size="sm" variant="inline" />
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
											<Link to="/signin">
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
					</div>
					<div className="hidden md:block">
						<HeaderSearch year={selectedYear} />
					</div>
				</div>
			</div>
		</header>
	);
}
