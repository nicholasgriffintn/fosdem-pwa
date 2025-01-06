"use client";

import { useState } from "react";

import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/Spinner";
import { Icons } from "~/components/Icons";
import { constants } from "~/constants";

export function SignInForm() {
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		setIsSubmitting(true);
	};

	return (
		<form method="GET" className="flex flex-col" onSubmit={handleSubmit}>
			<Button
				formAction="/api/auth/github"
				type="submit"
				variant="outline"
				size="lg"
				className="w-full"
				disabled={isSubmitting}
			>
				{isSubmitting ? (
					<Spinner className="w-4 h-4 mr-2" />
				) : (
					<Icons.gitHub className="w-4 h-4 mr-2" />
				)}
				Sign in with GitHub
			</Button>
			<div
				className="cf-turnstile"
				data-sitekey={constants.TURNSTILE_SITE_KEY}
			/>
		</form>
	);
}
