import type { ReactNode } from "react";
import { useRef, useEffect } from "react";
import { Link } from "@tanstack/react-router";

import { cn } from "~/lib/utils";
import { useLockBody } from "~/hooks/use-lock-body";
import { useAuth } from "~/hooks/use-auth";
import { Icons } from "~/components/shared/Icons";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { constants } from "~/constants";
import { isNumber } from "~/lib/type-guards";

type MobileNavProps = {
	items: {
		title: string;
		href: string;
		icon?: React.ReactNode;
		disabled?: boolean;
	}[];
	menuCheckboxRef?: React.RefObject<HTMLInputElement | null>;
	isOpen: boolean;
	onClose: () => void;
	children?: ReactNode;
};

export function MobileNav({
	items,
	menuCheckboxRef,
	isOpen,
	onClose,
}: MobileNavProps) {
	useLockBody(isOpen);
	const { user, logout } = useAuth();

	const firstLinkRef = useRef<HTMLAnchorElement | null>(null);

	useEffect(() => {
		firstLinkRef.current?.focus();

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape" && menuCheckboxRef?.current) {
				event.preventDefault();
				menuCheckboxRef.current.checked = false;
				menuCheckboxRef.current.focus();
				onClose();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [menuCheckboxRef]);

	return (
		<div
			className={cn(
				"fixed inset-0 top-16 z-50 grid h-[calc(100vh-4rem)] grid-flow-row auto-rows-max overflow-auto p-6 pb-32 shadow-md animate-in slide-in-from-bottom-80 lg:hidden",
			)}
			id="mobile-nav"
			role="dialog"
			aria-modal="true"
			aria-label="Mobile navigation"
		>
			<div className="relative z-20 grid gap-6 rounded-md bg-popover p-4 text-popover-foreground shadow-md border border-border">
				<nav className="grid grid-flow-row auto-rows-max text-sm">
					{items.map((item, index) => (
						<Link
							key={item.href}
							to={item.disabled ? "#" : item.href}
							className={cn(
								"flex w-full items-center gap-2 rounded-md p-2 text-sm font-medium transition-colors text-foreground/80 hover:text-foreground hover:bg-muted no-underline",
								item.disabled && "cursor-not-allowed opacity-60",
							)}
							activeProps={{
								className: cn(
									"flex w-full items-center gap-2 rounded-md p-2 text-sm font-medium transition-colors bg-muted text-foreground",
									item.disabled && "cursor-not-allowed opacity-60",
								),
							}}
							onClick={() => {
								if (menuCheckboxRef?.current) {
									menuCheckboxRef.current.checked = false;
								}
								onClose();
							}}
							search={(prev: Record<string, unknown>) => ({
								year: isNumber(prev.year) ? prev.year : constants.DEFAULT_YEAR,
							})}
							activeOptions={{ exact: item.href === "/" }}
							ref={index === 0 ? firstLinkRef : undefined}
						>
							{item.icon}
							{item.title}
						</Link>
					))}

					<div className="border-t my-4" />

					{user?.id && (
						<div className="flex items-center gap-2 p-2">
							<Icons.user className="h-4 w-4" />
							<div className="flex items-center gap-2">
								<span className="text-sm font-medium">{user.name}</span>
								{user.is_guest && (
									<Badge variant="secondary" className="text-xs">
										Guest
									</Badge>
								)}
							</div>
						</div>
					)}

					{user?.id ? (
						<>
							{!user.is_guest && (
								<Button
									variant="ghost"
									className="flex items-center justify-start gap-2 w-full"
									asChild
								>
									<Link
										search={(prev: Record<string, unknown>) => ({
											year: isNumber(prev.year) ? prev.year : constants.DEFAULT_YEAR,
										})}
										to="/profile"
										onClick={() => {
											if (menuCheckboxRef?.current) {
												menuCheckboxRef.current.checked = false;
											}
											onClose();
										}}
										className="no-underline"
									>
										View Profile
									</Link>
								</Button>
							)}
							{user.is_guest && (
								<Button
									variant="ghost"
									className="flex items-center justify-start gap-2 w-full"
									asChild
								>
									<a href="/api/auth/upgrade-github">
										<Icons.gitHub className="h-5 w-5" />
										Upgrade with GitHub
									</a>
								</Button>
							)}
							<Button
								variant="ghost"
								className="flex items-center justify-start gap-2 w-full"
								onClick={() => {
									logout();
									if (menuCheckboxRef?.current) {
										menuCheckboxRef.current.checked = false;
									}
									onClose();
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
								<Link to="/signin" onClick={() => {
									if (menuCheckboxRef?.current) {
										menuCheckboxRef.current.checked = false;
									}
									onClose();
								}} className="no-underline">
								<Icons.login className="h-5 w-5" />
								Sign In
							</Link>
						</Button>
					)}

					<Button
						variant="ghost"
						className="flex items-center justify-start gap-2 w-full"
						asChild
					>
						<a
							href="https://github.com/nicholasgriffintn/fosdem-pwa"
							target="_blank"
							rel="noreferrer"
							className="no-underline"
						>
							<Icons.gitHub className="h-5 w-5" />
							View Source
						</a>
					</Button>
				</nav>
			</div>
		</div>
	);
}
