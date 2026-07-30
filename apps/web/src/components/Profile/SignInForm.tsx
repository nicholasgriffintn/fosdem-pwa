"use client";

import {
	AuthFlow,
	AuthProvider,
	type ExternalAuthProvider,
} from "@ngriffin_uk/auth-react";

import { Icons } from "~/components/shared/Icons";
import { constants } from "~/constants";

const providers: readonly ExternalAuthProvider[] = [
	{
		id: "mastodon",
		label: "Sign in with Mastodon",
		icon: <Icons.mastodon className="w-4 h-4" />,
		className:
			"bg-indigo-600 text-white hover:bg-indigo-700 hover:text-white border-indigo-700",
		fields: [
			{
				name: "server",
				label: "Mastodon server",
				type: "select",
				required: true,
				placeholder: "Select your Mastodon server...",
				options: [
					{ label: "mastodon.social", value: "mastodon.social" },
					{ label: "mastodon.online", value: "mastodon.online" },
				],
			},
		],
		submitLabel: "Continue",
	},
	{
		id: "gitlab",
		label: "Sign in with GitLab",
		icon: <Icons.gitlab className="w-4 h-4" />,
		className:
			"bg-[#C2410C] text-white hover:bg-[#9A3412] hover:text-white border-[#9A3412]",
	},
	{
		id: "github",
		label: "Sign in with GitHub",
		icon: <Icons.gitHub className="w-4 h-4" />,
		className:
			"bg-gray-900 text-white hover:bg-gray-800 hover:text-white border-gray-700",
	},
	{
		id: "discord",
		label: "Sign in with Discord",
		icon: <Icons.discord className="w-4 h-4" />,
		className:
			"bg-[#5865F2] text-white hover:bg-[#4752C4] hover:text-white border-[#4752C4]",
	},
	{
		id: "guest",
		label: "Continue as Guest",
		icon: <Icons.user className="w-4 h-4" />,
		className:
			"border border-input bg-secondary text-secondary-foreground hover:bg-secondary/80",
		separatorBefore: "Or",
	},
];

interface SignInFormProps {
	readonly initialError?: string;
}

export function SignInForm({ initialError }: SignInFormProps) {
	return (
		<div className="flex flex-col gap-4">
			<AuthProvider
				config={{
					initialError,
					capabilities: {
						magicLink: false,
						password: false,
						passkeys: false,
						recovery: false,
						signOut: false,
						signUp: false,
					},
					providers,
					classNames: {
						button:
							"inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50",
						error:
							"rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive",
						field: "flex flex-col gap-2",
						form: "mt-3 flex flex-col gap-3",
						input:
							"h-11 rounded-lg border border-input bg-background px-3 text-sm",
						label: "text-sm font-medium",
						panel: "flex flex-col gap-4",
						providerButton:
							"inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg border px-8 text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50",
						providerList: "flex flex-col gap-4",
						separator:
							"flex items-center justify-center text-xs uppercase text-muted-foreground before:mr-2 before:h-px before:flex-1 before:bg-border after:ml-2 after:h-px after:flex-1 after:bg-border",
						title: "sr-only",
					},
					onAuthenticated: () => window.location.assign("/"),
				}}
			>
				<AuthFlow />
			</AuthProvider>

			<p className="text-sm text-muted-foreground text-center max-w-md mx-auto">
				Guest accounts will not work across devices, and data may be lost if you
				clear your browser data. These are meant to be used temporarily only.
			</p>

			<div
				className="cf-turnstile js-required"
				data-sitekey={constants.TURNSTILE_SITE_KEY}
			/>
		</div>
	);
}
