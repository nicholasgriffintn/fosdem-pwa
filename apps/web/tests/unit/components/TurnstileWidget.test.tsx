import { fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TurnstileWidget } from "~/components/Profile/TurnstileWidget";

describe("TurnstileWidget", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("renders explicitly and removes its widget on unmount", () => {
		const renderWidget = vi.fn().mockReturnValue("widget-id");
		const removeWidget = vi.fn();
		vi.stubGlobal("turnstile", {
			remove: removeWidget,
			render: renderWidget,
			reset: vi.fn(),
		});

		const { container, unmount } = render(
			<TurnstileWidget siteKey="site-key" action="authentication" />,
		);
		const widgetContainer = container.querySelector<HTMLElement>(".js-required");

		expect(renderWidget).toHaveBeenCalledWith(widgetContainer, {
			action: "authentication",
			appearance: "interaction-only",
			sitekey: "site-key",
			size: "flexible",
		});

		unmount();

		expect(removeWidget).toHaveBeenCalledWith("widget-id");
	});

	it("renders when the Turnstile script finishes loading", () => {
		const renderWidget = vi.fn().mockReturnValue("widget-id");
		vi.stubGlobal("turnstile", undefined);
		render(
			<TurnstileWidget siteKey="site-key" action="authentication" />,
		);
		const script = document.getElementById("cloudflare-turnstile-api");

		if (!script) {
			throw new Error("Turnstile script was not rendered.");
		}

		vi.stubGlobal("turnstile", {
			remove: vi.fn(),
			render: renderWidget,
			reset: vi.fn(),
		});
		fireEvent.load(script);

		expect(renderWidget).toHaveBeenCalledOnce();
	});
});
