"use client";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Icons } from "~/components/shared/Icons";

/**
 * Structural shape rather than a concrete row type, so this renders both full
 * account records and the public projection (which has no `email`).
 */
type AvatarUser = {
	name?: string | null;
	email?: string | null;
	avatar_url?: string | null;
};

type UserAvatarProps = {
	user: AvatarUser;
	className?: string;
	size?: "sm" | "md" | "lg" | "xl";
	borderColor?: string;
};

function getInitials(name?: string | null): string {
	if (!name) return "?";
	const parts = name
		.trim()
		.split(/\s+/)
		.filter(Boolean);
	if (parts.length === 0) return "?";
	const first = parts[0]?.[0] ?? "?";
	const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
	return `${first}${last}`.toUpperCase();
}

function getDisplayName(user: AvatarUser): string {
	if (user.name) return user.name;
	if (user.email) return user.email.split("@")[0] ?? "Anonymous";
	return "Anonymous";
}

export function UserAvatar({
	user,
	className,
	size = "md",
	borderColor,
}: UserAvatarProps) {
	const displayName = getDisplayName(user);
	const initials = getInitials(user.name);

	const sizeClasses = {
		sm: "h-7 w-7",
		md: "h-9 w-9",
		lg: "h-16 w-16",
		xl: "h-24 w-24",
	};

	const iconSizes = {
		sm: "h-4 w-4",
		md: "h-5 w-5",
		lg: "h-8 w-8",
		xl: "h-12 w-12",
	};

	const borderStyle = borderColor ? { borderColor, borderWidth: "4px" } : undefined;

	return (
		<Avatar className={className || sizeClasses[size]} style={borderStyle}>
			{user.avatar_url ? (
				<AvatarImage src={user.avatar_url} alt={displayName} />
			) : null}
			<AvatarFallback className="bg-muted text-muted-foreground">
				{initials !== "?" ? (
					<span className="font-medium">{initials}</span>
				) : (
					<Icons.user className={iconSizes[size]} />
				)}
			</AvatarFallback>
		</Avatar>
	);
}
