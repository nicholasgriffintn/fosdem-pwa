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
		if (!isOpen) return;

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
	}, [isOpen, menuCheckboxRef, onClose]);

	return (
		<div
			className={cn(
				"fixed inset-0 z-50 lg:hidden",
				"opacity-0 pointer-events-none transition-opacity duration-200",
				"peer-checked/menu:opacity-100 peer-checked/menu:pointer-events-auto",
			)}
			id="mobile-nav"
			role="dialog"
			aria-modal="true"
			aria-label="Mobile navigation"
			aria-hidden={!isOpen}
		>
			<label
				htmlFor="mobile-menu-toggle"
				className="absolute inset-0 bg-black/50 backdrop-blur-sm"
				aria-label="Close menu"
			/>
			<div
				className={cn(
					"relative flex h-[100svh] w-full flex-col bg-background",
				)}
			>
				<div className="border-b">
					<div className="container flex h-16 items-center justify-between gap-3">
					<div className="flex items-center gap-2">
						<Icons.logo className="h-7 w-7" width="28" height="28" />
						<span className="font-bold">Menu</span>
					</div>
					<label
						htmlFor="mobile-menu-toggle"
						className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-background text-foreground/80 hover:bg-muted/60 hover:text-foreground cursor-pointer"
						aria-label="Close menu"
					>
						<Icons.close className="h-4 w-4" />
					</label>
				</div>
				</div>

				<div className="container flex-1 overflow-y-auto py-4 pb-[calc(5rem+env(safe-area-inset-bottom))]">
					<nav className="grid gap-1 text-base" aria-label="Primary">
						{items.map((item, index) => (
							<Link
								key={item.href}
								to={item.disabled ? "#" : item.href}
								className={cn(
									"flex w-full items-center gap-3 rounded-lg px-3 py-3 font-medium transition-colors",
									"text-foreground/90 hover:bg-muted/60 hover:text-foreground no-underline",
									item.disabled && "cursor-not-allowed opacity-60",
								)}
								activeProps={{
									className: cn(
										"flex w-full items-center gap-3 rounded-lg px-3 py-3 font-medium transition-colors",
										"bg-muted text-foreground",
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
								<span>{item.title}</span>
							</Link>
						))}
					</nav>

					<div className="my-5 border-t" />

					{user?.id && (
						<div className="flex items-center gap-3 rounded-lg border bg-muted/20 px-3 py-3">
							<div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
								<Icons.user className="h-4 w-4" />
							</div>
							<div className="min-w-0 flex-1">
								<div className="truncate text-sm font-medium">{user.name}</div>
								{user.is_guest && (
									<Badge variant="secondary" className="mt-1 text-xs">
										Guest
									</Badge>
								)}
							</div>
						</div>
					)}

					<div className="mt-4 grid gap-1">
						{user?.id ? (
							<>
								{!user.is_guest && (
									<Button
										variant="ghost"
										className="h-11 justify-start gap-3 rounded-lg px-3"
										asChild
									>
										<Link
											search={(prev: Record<string, unknown>) => ({
												year: isNumber(prev.year)
													? prev.year
													: constants.DEFAULT_YEAR,
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
										className="h-11 justify-start gap-3 rounded-lg px-3"
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
									className="h-11 justify-start gap-3 rounded-lg px-3"
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
									className="h-11 justify-start gap-3 rounded-lg px-3"
									asChild
								>
									<Link
										to="/signin"
										onClick={() => {
											if (menuCheckboxRef?.current) {
												menuCheckboxRef.current.checked = false;
											}
											onClose();
									}}
									className="no-underline"
								>
									<Icons.login className="h-5 w-5" />
									Sign In
								</Link>
							</Button>
						)}

						<Button
							variant="ghost"
							className="h-11 justify-start gap-3 rounded-lg px-3"
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
					</div>
				</div>
			</div>
		</div>
	);
}
