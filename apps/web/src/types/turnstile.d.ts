export {};

declare global {
	interface TurnstileRenderOptions {
		readonly action?: string;
		readonly appearance?: "always" | "execute" | "interaction-only";
		readonly sitekey: string;
		readonly size?: "compact" | "flexible" | "normal";
	}

	interface TurnstileApi {
		remove(widgetId: string): void;
		render(container: HTMLElement, options: TurnstileRenderOptions): string;
		reset(widgetId?: string): void;
	}

	interface Window {
		readonly turnstile?: TurnstileApi;
	}
}
