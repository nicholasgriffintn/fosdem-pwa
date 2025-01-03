import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

import { cn } from "~/lib/utils";
import { useLockBody } from "~/hooks/use-lock-body";
import { useAuth } from "~/hooks/use-auth";
import { Icons } from "./Icons";
import { Button } from "./ui/button";
import { constants } from "~/constants";
interface MobileNavProps {
	items: {
		title: string;
		href: string;
		icon?: React.ReactNode;
		disabled?: boolean;
	}[];
	onCloseMenu: () => void;
	children?: ReactNode;
}

export function MobileNav({ items, onCloseMenu }: MobileNavProps) {
	useLockBody();
	const { user, logout } = useAuth();

	return (
		<div
			className={cn(
				"fixed inset-0 top-16 z-50 grid h-[calc(100vh-4rem)] grid-flow-row auto-rows-max overflow-auto p-6 pb-32 shadow-md animate-in slide-in-from-bottom-80 lg:hidden",
			)}
		>
			<div className="relative z-20 grid gap-6 rounded-md bg-popover p-4 text-popover-foreground shadow-md border border-border">
				<nav className="grid grid-flow-row auto-rows-max text-sm">
					{items.map((item, index) => (
						<Link
							key={item.href}
							to={item.disabled ? "#" : item.href}
							className={cn(
								"flex w-full items-center gap-2 rounded-md p-2 text-sm font-medium hover:underline",
								item.disabled && "cursor-not-allowed opacity-60",
							)}
							onClick={onCloseMenu}
							search={(prev) => ({
								...prev,
								year: prev.year || constants.DEFAULT_YEAR,
							})}
						>
							{item.icon}
							{item.title}
						</Link>
					))}

					<div className="border-t my-4" />

					<Button
						variant="ghost"
						className="flex items-center justify-start gap-2 w-full"
						asChild
					>
						<a
							href="https://github.com/nicholasgriffintn/fosdem-pwa"
							target="_blank"
							rel="noreferrer"
							onClick={onCloseMenu}
						>
							<Icons.gitHub className="h-5 w-5" />
							View Source
						</a>
					</Button>

					{user ? (
						<>
							<Button
								variant="ghost"
								className="flex items-center justify-start gap-2 w-full"
								asChild
							>
								<Link
									search={(prev) => ({
										...prev,
										year: prev.year || constants.DEFAULT_YEAR,
									})}
									to="/profile"
									onClick={onCloseMenu}
								>
									<Icons.user className="h-5 w-5" />
									View Profile
								</Link>
							</Button>
							<Button
								variant="ghost"
								className="flex items-center justify-start gap-2 w-full"
								onClick={() => {
									logout();
									onCloseMenu();
								}}
							>
								<Icons.logout className="h-5 w-5" />
								Sign Out
							</Button>
						</>
					) : (
						<Button
							variant="ghost"
							className="flex items-center justify-start gap-2 w-full"
							asChild
						>
							<Link to="/signin" onClick={onCloseMenu}>
								<Icons.login className="h-5 w-5" />
								Sign In
							</Link>
						</Button>
					)}
				</nav>
			</div>
		</div>
	);
}
