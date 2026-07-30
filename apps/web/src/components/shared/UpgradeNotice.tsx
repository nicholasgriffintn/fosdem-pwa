"use client";

import {
	AuthProvider,
	AuthProviderList,
	type ExternalAuthProvider,
} from "@ngriffin_uk/auth-react";

import { Icons } from "~/components/shared/Icons";

interface UpgradeNoticeProps {
	user: {
		is_guest: boolean | null;
	};
}

export function UpgradeNotice({ user }: UpgradeNoticeProps) {
	if (!user.is_guest) {
		return null;
	}

	return (
		<div className="bg-muted/50 p-4 rounded-lg">
			<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
				<div className="flex-1">
					<p className="text-sm text-muted-foreground">
						You're using a guest account. Upgrade to save your data across
						devices.
					</p>
				</div>
				<AuthProvider
					config={{
						capabilities: {
							magicLink: false,
							password: false,
							passkeys: false,
							recovery: false,
							signOut: false,
							signUp: false,
						},
						providers: upgradeProviders,
						classNames: {
							actions: "flex justify-end gap-3",
							button:
								"inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50",
							description: "text-sm leading-relaxed text-muted-foreground",
							dialog:
								"m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-border bg-background p-0 text-foreground shadow-xl backdrop:bg-black/70",
							dialogContent: "flex flex-col gap-4 p-6",
							field: "flex flex-col gap-2",
							form: "flex flex-col gap-4",
							input:
								"h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
							label: "text-sm font-medium",
							linkButton:
								"inline-flex h-10 items-center justify-center rounded-lg bg-secondary px-4 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 disabled:pointer-events-none disabled:opacity-50",
							providerButton:
								"inline-flex w-full sm:w-auto justify-center items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
							providerList: "flex flex-col sm:flex-row gap-2 w-full sm:w-auto",
							title: "text-lg font-semibold",
						},
					}}
				>
					<AuthProviderList
						fieldPresentation="modal"
						label="Upgrade account providers"
					/>
				</AuthProvider>
			</div>
		</div>
	);
}

const upgradeProviders: readonly ExternalAuthProvider[] = [
	{
		id: "github",
		label: "GitHub",
		icon: <Icons.gitHub className="h-4 w-4" />,
		className: "border-gray-700 bg-gray-900 text-white hover:bg-gray-800",
		values: { upgrade: "true" },
	},
	{
		id: "discord",
		label: "Discord",
		icon: <Icons.discord className="h-4 w-4" />,
		className: "border-[#4752C4] bg-[#5865F2] text-white hover:bg-[#4752C4]",
		values: { upgrade: "true" },
	},
	{
		id: "gitlab",
		label: "GitLab",
		icon: <Icons.gitlab className="h-4 w-4" />,
		className: "border-[#E24329] bg-[#FC6D26] text-white hover:bg-[#E24329]",
		values: { upgrade: "true" },
	},
	{
		id: "mastodon",
		label: "Mastodon",
		icon: <Icons.mastodon className="h-4 w-4" />,
		className: "border-indigo-700 bg-indigo-600 text-white hover:bg-indigo-700",
		fields: [
			{
				name: "server",
				label: "Mastodon Server",
				type: "select",
				required: true,
				placeholder: "Select your Mastodon server...",
				options: [
					{ label: "mastodon.social", value: "mastodon.social" },
					{ label: "mastodon.online", value: "mastodon.online" },
				],
			},
		],
		formTitle: "Choose your Mastodon server",
		formDescription:
			"Mastodon accounts are hosted on different servers. Choose the one you want to upgrade your guest account with. Only listed servers are currently supported; use another upgrade method if yours is not listed.",
		submitLabel: "Upgrade with Mastodon",
		values: { upgrade: "true" },
	},
];
