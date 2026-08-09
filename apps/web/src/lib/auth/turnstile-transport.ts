import {
	createBrowserAuthTransport,
	type AuthRequest,
	type AuthTransport,
} from "@ngriffin_uk/auth-react";

export const turnstileAuthTransport: AuthTransport = {
	async execute(request: AuthRequest) {
		const transport = createBrowserAuthTransport();
		if (request.action !== "start_oauth") {
			return transport.execute(request);
		}
		const turnstileToken = document
			.querySelector<HTMLInputElement>('input[name="cf-turnstile-response"]')
			?.value.trim();
		if (!turnstileToken) {
			throw new Error("Complete the verification challenge before continuing.");
		}
		try {
			return await transport.execute({
				...request,
				values: {
					...request.values,
					turnstileToken,
				},
			});
		} catch (cause) {
			window.turnstile?.reset();
			throw cause;
		}
	},
};
