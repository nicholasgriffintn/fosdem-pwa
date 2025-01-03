"use client";

import { Link } from "@tanstack/react-router";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { User as UserIcon } from "lucide-react";
import type { SessionUser } from "../server/auth";
import { constants } from "~/constants";
interface AvatarMenuProps {
	user: SessionUser;
}

export function AvatarMenu({ user }: AvatarMenuProps) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger className="outline-none">
				<Avatar className="h-7 w-7">
					<AvatarImage
						src={user.avatar_url ?? undefined}
						alt={user.name ?? undefined}
					/>
					<AvatarFallback>
						<UserIcon className="h-4 w-4" />
					</AvatarFallback>
				</Avatar>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-56">
				<div className="flex items-center justify-start gap-2 p-2">
					<div className="flex flex-col space-y-1">
						<p className="text-sm font-medium leading-none">{user.name}</p>
						<p className="text-xs leading-none text-muted-foreground">
							{user.email}
						</p>
					</div>
				</div>
				<DropdownMenuSeparator />
				<DropdownMenuItem asChild>
					<Link
						search={(prev) => ({
							...prev,
							year: prev.year || constants.DEFAULT_YEAR,
						})}
						to="/profile"
					>
						View profile
					</Link>
				</DropdownMenuItem>
				<DropdownMenuItem>
					<a href="/api/auth/logout">Sign out</a>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
