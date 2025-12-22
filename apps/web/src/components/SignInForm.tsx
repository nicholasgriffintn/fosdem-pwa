"use client";

import { useState } from "react";

import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/Spinner";
import { Icons } from "~/components/Icons";
import { constants } from "~/constants";

export function SignInForm() {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isGuestSubmitting, setIsGuestSubmitting] = useState(false);

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		setIsSubmitting(true);
	};

	const handleGuestSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		setIsGuestSubmitting(true);
	};

	return (
		<div className="flex flex-col gap-4">
			<form method="GET" onSubmit={handleSubmit}>
				<Button
					formAction="/api/auth/github"
					type="submit"
					variant="outline"
					size="lg"
					className="w-full cursor-pointer"
					disabled={isSubmitting || isGuestSubmitting}
				>
					{isSubmitting && <Spinner className="w-4 h-4 mr-2" />}
					{!isSubmitting && <Icons.gitHub className="w-4 h-4 mr-2" />}
					Sign in with GitHub
				</Button>
			</form>

			<div className="relative">
				<div className="absolute inset-0 flex items-center">
					<span className="w-full border-t" />
				</div>
				<div className="relative flex justify-center text-xs uppercase">
					<span className="bg-background px-2 text-muted-foreground">Or</span>
				</div>
			</div>

			<form method="POST" action="/api/auth/guest" onSubmit={handleGuestSubmit}>
				<Button
					type="submit"
					variant="secondary"
					size="lg"
					className="w-full cursor-pointer"
					disabled={isSubmitting || isGuestSubmitting}
				>
					{isGuestSubmitting && <Spinner className="w-4 h-4 mr-2" />}
					{!isGuestSubmitting && <Icons.user className="w-4 h-4 mr-2" />}
					Continue as Guest
				</Button>
			</form>

			<p className="text-sm text-muted-foreground text-center max-w-md mx-auto">
				Guest accounts will not work across devices, and data may be lost if
				you clear your browser data. These are meant to be used temporarily
				only.
			</p>

			<div
				className="cf-turnstile js-required"
				data-sitekey={constants.TURNSTILE_SITE_KEY}
			/>
		</div>
	);
}
