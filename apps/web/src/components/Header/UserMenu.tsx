"use client";

import { useEffect, useId, useRef } from "react";
import { Link, useRouterState } from "@tanstack/react-router";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import type { SessionUser } from "~/server/auth";
import { constants } from "~/constants";
import { Icons } from "~/components/shared/Icons";

type AvatarMenuProps = {
	user: SessionUser;
};

export function AvatarMenu({ user }: AvatarMenuProps) {
	const menuId = useId();
	const checkboxRef = useRef<HTMLInputElement>(null);
	const locationKey = useRouterState({
		select: (state) => state.location.href,
	});

	useEffect(() => {
		if (checkboxRef.current) {
			checkboxRef.current.checked = false;
		}
	}, [locationKey]);

	return (
		<div className="relative">
			<input
				type="checkbox"
				id={`user-menu-${menuId}`}
				ref={checkboxRef}
				className="peer/avatar sr-only"
			/>
			<label htmlFor={`user-menu-${menuId}`} className="cursor-pointer">
				<Avatar className="h-7 w-7">
					<AvatarImage
						src={user.avatar_url ?? undefined}
						alt={user.name ?? undefined}
					/>
					<AvatarFallback>
						<Icons.user className="h-4 w-4" />
					</AvatarFallback>
				</Avatar>
			</label>
			<div className="hidden peer-checked/avatar:block absolute right-0 mt-2 w-56 rounded-md border bg-popover text-popover-foreground shadow-md z-50 p-1">
				<div className="flex items-center justify-start gap-2 p-2 min-w-0">
					<div className="flex flex-col space-y-1 min-w-0 flex-1">
						<div className="flex items-center gap-2 min-w-0">
							<p className="text-sm font-medium leading-none truncate">{user.name}</p>
							{user.is_guest && (
								<Badge variant="secondary" className="text-xs">
									Guest
								</Badge>
							)}
						</div>
						<p className="text-xs leading-none text-muted-foreground truncate max-w-[200px]">
							{user.email}
						</p>
					</div>
				</div>
				<div className="border-t my-1" />
				{user.is_guest && (
					<>
						<Link
							to="/profile"
							search={(prev) => ({
								year: prev.year || constants.DEFAULT_YEAR,
							})}
							className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent transition-colors no-underline hover:underline text-foreground"
						>
							<Icons.user className="h-4 w-4" />
							Upgrade Account
						</Link>
						<p className="px-2 py-1.5 text-xs text-muted-foreground">
							Upgrade to persist your data.
						</p>
					</>
				)}
				<Link
					to="/profile"
					search={(prev) => ({
						year: prev.year || constants.DEFAULT_YEAR,
					})}
					className="flex items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent transition-colors no-underline hover:underline text-foreground"
				>
					View profile
				</Link>
				<a
					href="/api/auth/logout"
					className="flex items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent transition-colors no-underline hover:underline"
				>
					Sign out
				</a>
			</div>
		</div>
	);
}
