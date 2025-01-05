"use client";

import { QRCodeSVG } from "qrcode.react";

import { Card } from "~/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Icons } from "~/components/Icons";

interface User {
	id: number;
	name: string;
	avatar_url: string;
	email: string;
	github_username: string;
	company?: string;
	site?: string;
	location?: string;
	bio?: string;
	twitter_username?: string;
}

interface ConferenceBadgeProps {
	user: User;
	conferenceYear: number;
}

export function ConferenceBadge({
	user,
	conferenceYear,
}: ConferenceBadgeProps) {
	if (!user) {
		return null;
	}

	return (
		<Card className="w-full max-w-md mx-auto overflow-hidden">
			<div className="bg-[#9B3493] p-6 text-white">
				<div className="flex items-center justify-between">
					<h1 className="text-2xl font-bold">FOSDEM {conferenceYear}</h1>
					<div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
						<div className="w-10 h-10 b-white rounded">
							<Icons.logo className="w-full h-full" />
						</div>
					</div>
				</div>
			</div>

			<div className="p-6">
				<div className="flex items-start gap-4">
					<Avatar className="w-24 h-24 border-4 border-[#9B3493]">
						<AvatarImage src={user.avatar_url} alt={user.name} />
						<AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
					</Avatar>
					<div className="flex-1">
						<h2 className="text-2xl font-bold">{user.name}</h2>
						<p className="text-muted-foreground">{user.email}</p>
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
								href={user.site}
								target="_blank"
								rel="noopener noreferrer"
								className="text-[#9B3493] hover:underline"
							>
								{user.site.replace(/https?:\/\//, "")}
							</a>
						</div>
					)}
				</div>

				<div className="mt-6 flex flex-wrap gap-2">
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

				{user.github_username && (
					<div className="mt-6 flex justify-center">
						<div className="p-3 bg-white rounded-lg">
							<QRCodeSVG
								value={`https://fosdempwa.com/profile/${user.github_username}`}
								size={100}
								level="L"
							/>
						</div>
					</div>
				)}
			</div>

			<div className="px-6 py-4 bg-muted/50 text-center text-sm text-muted-foreground">
				<p>FOSDEM {conferenceYear} • Brussels, Belgium</p>
			</div>
		</Card>
	);
}
