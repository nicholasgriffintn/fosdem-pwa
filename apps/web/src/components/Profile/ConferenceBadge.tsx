"use client";

import { lazy, Suspense } from "react";
import { Link } from "@tanstack/react-router";

import { Card } from "~/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Icons } from "~/components/shared/Icons";
import type { User, UserConferenceStats } from "~/server/db/schema";
import { getAchievements } from "~/lib/achievements";

const QRCodeSVG = lazy(() =>
	import("qrcode.react").then((mod) => ({
		default: mod.QRCodeSVG,
	})),
);

type ConferenceBadgeProps = {
	user?: User | null;
	conferenceYear: number;
	stats?: UserConferenceStats | null;
};

function hashStringToInt(input: string) {
	let hash = 2166136261;
	for (let i = 0; i < input.length; i++) {
		hash ^= input.charCodeAt(i);
		hash = Math.imul(hash, 16777619);
	}
	return hash >>> 0;
}

function getInitials(name: string) {
	const parts = name
		.trim()
		.split(/\s+/)
		.filter(Boolean);
	if (parts.length === 0) return "?";
	const first = parts[0]?.[0] ?? "?";
	const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
	return `${first}${last}`.toUpperCase();
}

function normalizeSiteUrl(site: string) {
	if (/^https?:\/\//i.test(site)) return site;
	return `https://${site}`;
}

function getPublicProfileId(user: User) {
	return (
		user.github_username ||
		user.gitlab_username ||
		user.discord_username ||
		user.mastodon_acct ||
		user.mastodon_username ||
		null
	);
}

export function ConferenceBadge({
	user,
	conferenceYear,
	stats,
}: ConferenceBadgeProps) {
	if (!user) {
		return null;
	}

	const publicProfileId = getPublicProfileId(user);
	const displayName =
		user.name ||
		publicProfileId ||
		user.email?.split("@")[0] ||
		"Anonymous";
	const avatarAlt = user.name || displayName;
	const avatarFallback = getInitials(displayName);

	const profileUrl = publicProfileId
		? `https://fosdempwa.com/profile/${publicProfileId}`
		: null;

	const seed = `${user.id}_${conferenceYear}`;
	const hash = hashStringToInt(seed);
	const themes = [
		{ header: "#9B3493", accent: "#9B3493", pattern: "rgba(255,255,255,0.12)" },
		{ header: "#2563EB", accent: "#2563EB", pattern: "rgba(255,255,255,0.14)" },
		{ header: "#16A34A", accent: "#16A34A", pattern: "rgba(255,255,255,0.12)" },
		{ header: "#EA580C", accent: "#EA580C", pattern: "rgba(255,255,255,0.14)" },
		{ header: "#0F766E", accent: "#0F766E", pattern: "rgba(255,255,255,0.12)" },
	] as const;
	const theme = themes[hash % themes.length];
	const patternVariant = (hash >>> 3) % 3;
	const badgeNumber = (hash % 9000) + 1000;

	const achievements = getAchievements(stats);
	const earnedAchievements = achievements.filter((a) => a.earned);
	const totalAchievements = achievements.length;

	return (
		<Card className="w-full max-w-md mx-auto overflow-hidden">
			<div
				className="relative p-6 text-white"
				style={{ backgroundColor: theme.header }}
			>
				<div
					className="pointer-events-none absolute inset-0"
					style={{
						backgroundImage:
							patternVariant === 0
								? `repeating-linear-gradient(135deg, ${theme.pattern} 0 8px, transparent 8px 16px)`
								: patternVariant === 1
									? `radial-gradient(circle at 20% 20%, ${theme.pattern} 0 2px, transparent 2px 14px), radial-gradient(circle at 80% 30%, ${theme.pattern} 0 2px, transparent 2px 16px), radial-gradient(circle at 40% 80%, ${theme.pattern} 0 2px, transparent 2px 18px)`
									: `linear-gradient(90deg, ${theme.pattern} 0 1px, transparent 1px 18px), linear-gradient(0deg, ${theme.pattern} 0 1px, transparent 1px 18px)`,
						opacity: 0.9,
					}}
				/>
				<div className="flex items-center justify-between">
					<div className="flex flex-col">
						<h1 className="text-2xl font-bold">FOSDEM {conferenceYear}</h1>
						<p className="text-xs/5 text-white/80">Badge #{badgeNumber}</p>
					</div>
					<div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
						<div className="w-10 h-10 b-white rounded">
							<Icons.logo className="w-full h-full" />
						</div>
					</div>
				</div>
			</div>

			<div className="p-6">
				<div className="flex items-start gap-4">
					<Avatar
						className="w-24 h-24 border-4"
						style={{ borderColor: theme.accent }}
					>
						{user.avatar_url ? (
							<AvatarImage src={user.avatar_url} alt={avatarAlt} />
						) : null}
						<AvatarFallback>{avatarFallback}</AvatarFallback>
					</Avatar>
					<div className="flex-1">
						<h2 className="text-2xl font-bold text-foreground">{displayName}</h2>
						{user.email && <p className="text-muted-foreground">{user.email}</p>}
						{user.bio && (
							<p className="mt-2 text-sm text-muted-foreground line-clamp-2">
								{user.bio}
							</p>
						)}
					</div>
				</div>

				<div className="mt-6 space-y-2">
					{user.company && (
						<div className="flex items-center gap-2 text-sm">
							<Icons.building className="w-4 h-4 text-muted-foreground" />
							<span>{user.company}</span>
						</div>
					)}
					{user.location && (
						<div className="flex items-center gap-2 text-sm">
							<Icons.mapPin className="w-4 h-4 text-muted-foreground" />
							<span>{user.location}</span>
						</div>
					)}
					{user.site && (
						<div className="flex items-center gap-2 text-sm">
							<Icons.globe className="w-4 h-4 text-muted-foreground" />
							<a
								href={normalizeSiteUrl(user.site)}
								target="_blank"
								rel="noopener noreferrer"
								className="hover:underline"
								style={{ color: theme.accent }}
							>
								{user.site.replace(/https?:\/\//, "")}
							</a>
						</div>
					)}
				</div>

				<div className="mt-6 flex flex-wrap gap-2">
					{user.discord_username && (
						<Badge variant="secondary" className="flex items-center gap-1">
							<Icons.discord className="w-3 h-3" />
							<span className="text-white">{user.discord_username}</span>
						</Badge>
					)}
					{user.github_username && (
						<Badge variant="secondary" className="flex items-center gap-1">
							<Icons.gitHub className="w-3 h-3" />
							<a
								href={`https://github.com/${user.github_username}`}
								target="_blank"
								rel="noopener noreferrer"
								className="text-white no-underline hover:underline"
							>
								{user.github_username}
							</a>
						</Badge>
					)}
					{user.gitlab_username && (
						<Badge variant="secondary" className="flex items-center gap-1">
							<Icons.gitlab className="w-3 h-3" />
							<a
								href={`https://gitlab.com/${user.gitlab_username}`}
								target="_blank"
								rel="noopener noreferrer"
								className="text-white no-underline hover:underline"
							>
								{user.gitlab_username}
							</a>
						</Badge>
					)}
					{(user.mastodon_acct || user.mastodon_username) && (
						<Badge variant="secondary" className="flex items-center gap-1">
							<Icons.mastodon className="w-3 h-3" />
							{user.mastodon_url ? (
								<a
									href={user.mastodon_url}
									target="_blank"
									rel="noopener noreferrer"
									className="text-white no-underline hover:underline"
								>
									{user.mastodon_acct || user.mastodon_username}
								</a>
							) : (
								<span className="text-white">
									{user.mastodon_acct || user.mastodon_username}
								</span>
							)}
						</Badge>
					)}
					{user.twitter_username && (
						<Badge variant="secondary" className="flex items-center gap-1">
							<Icons.twitter className="w-3 h-3" />
							<a
								href={`https://twitter.com/${user.twitter_username}`}
								target="_blank"
								rel="noopener noreferrer"
								className="text-white no-underline hover:underline"
							>
								@{user.twitter_username}
							</a>
						</Badge>
					)}
				</div>

				<div className="mt-6 space-y-3">
					{stats && earnedAchievements.length > 0 && (
						<>
							<div className="flex items-center justify-between">
								<h3 className="text-sm font-semibold text-foreground">
									Achievements
								</h3>
								<span className="text-xs text-muted-foreground">
									{earnedAchievements.length} of {totalAchievements}
								</span>
							</div>
							<div className="grid grid-cols-2 gap-2">
								{earnedAchievements.slice(0, 4).map((achievement) => {
									const Icon = Icons[achievement.icon];
									return (
										<div
											key={achievement.id}
											className="bg-muted/50 rounded-lg p-2.5 flex items-center gap-2"
										>
											<div
												className="h-7 w-7 rounded-md flex items-center justify-center flex-shrink-0"
												style={{ backgroundColor: `${theme.accent}22` }}
											>
												<Icon className="h-3.5 w-3.5" style={{ color: theme.accent }} />
											</div>
											<span className="text-xs font-medium text-foreground leading-tight line-clamp-2">
												{achievement.label}
											</span>
										</div>
									);
								})}
							</div>
							{earnedAchievements.length > 4 && (
								<p className="text-xs text-center text-muted-foreground">
									+{earnedAchievements.length - 4} more
								</p>
							)}
						</>
					)}
					<Button asChild variant="outline" size="sm" className="w-full no-underline">
						<Link to="/profile/year-in-review" search={{ year: conferenceYear }}>
							<Icons.star className="h-3.5 w-3.5 mr-2" />
							View Year in Review
						</Link>
					</Button>
				</div>

				{profileUrl && (
					<>
						<div className="mt-6 flex justify-center">
							<div className="p-3 bg-white rounded-lg">
								<Suspense fallback={null}>
									<QRCodeSVG value={profileUrl} size={100} level="L" />
								</Suspense>
							</div>
						</div>
						<div className="mt-3 flex flex-col items-center gap-2">
							<a
								href={profileUrl}
								className="text-xs text-muted-foreground hover:underline break-all text-center"
							>
								{profileUrl}
							</a>
						</div>
					</>
				)}
			</div>

			<div className="px-6 py-4 bg-muted/50 text-center text-sm text-muted-foreground">
				<p>FOSDEM {conferenceYear} • Brussels, Belgium</p>
			</div>
		</Card>
	);
}
