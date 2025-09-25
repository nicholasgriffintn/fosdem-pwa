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

	const handleGuestSignIn = async (
		event: React.MouseEvent<HTMLButtonElement>,
	) => {
		event.preventDefault();
		setIsGuestSubmitting(true);
		try {
			const response = await fetch("/api/auth/guest", {
				method: "POST",
				credentials: "include",
			});
			if (response.ok) {
				window.location.href = "/";
			} else {
				throw new Error("Failed to sign in as guest");
			}
		} catch (error) {
			console.error("Guest sign in error:", error);
			setIsGuestSubmitting(false);
		}
	};

	return (
		<form method="GET" className="flex flex-col" onSubmit={handleSubmit}>
			<Button
				formAction="/api/auth/github"
				type="submit"
				variant="outline"
				size="lg"
				className="w-full"
				disabled={isSubmitting || isGuestSubmitting}
			>
				{isSubmitting ? (
					<Spinner className="w-4 h-4 mr-2" />
				) : (
					<Icons.gitHub className="w-4 h-4 mr-2" />
				)}
				Sign in with GitHub
			</Button>

			<div className="relative">
				<div className="absolute inset-0 flex items-center">
					<span className="w-full border-t" />
				</div>
				<div className="relative flex justify-center text-xs uppercase mt-4 mb-4">
					<span className="bg-background px-2 text-muted-foreground">Or</span>
				</div>
			</div>

			<Button
				type="button"
				variant="secondary"
				size="lg"
				className="w-full"
				disabled={isSubmitting || isGuestSubmitting}
				onClick={handleGuestSignIn}
			>
				{isGuestSubmitting ? (
					<Spinner className="w-4 h-4 mr-2" />
				) : (
					<Icons.user className="w-4 h-4 mr-2" />
				)}
				Continue as Guest
			</Button>
			<p className="text-sm text-slate-400 text-center max-w-md mx-auto mt-4">
				(You will be able to upgrade to a GitHub account later if you'd like to
				persist your data.)
			</p>

			<div
				className="cf-turnstile"
				data-sitekey={constants.TURNSTILE_SITE_KEY}
			/>
		</form>
	);
}
