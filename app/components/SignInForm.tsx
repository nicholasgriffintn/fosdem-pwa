"use client";

import { useState } from "react";

import { Button } from "./ui/button";
import { Spinner } from "./Spinner";
import { Icons } from "./Icons";

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
		</form>
	);
}
