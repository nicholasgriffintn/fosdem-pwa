import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "~/components/ui/resizable";

function TestLayout() {
	return (
		<ResizablePanelGroup
			autoSaveId="test-layout"
			orientation="horizontal"
			panelIds={["primary-panel", "secondary-panel"]}
		>
			<ResizablePanel id="primary-panel" defaultSize="75%">
				Primary
			</ResizablePanel>
			<ResizableHandle withHandle />
			<ResizablePanel id="secondary-panel" defaultSize="25%">
				Secondary
			</ResizablePanel>
		</ResizablePanelGroup>
	);
}

describe("ResizablePanelGroup", () => {
	it("renders on the server without browser storage", () => {
		const localStorageDescriptor = Object.getOwnPropertyDescriptor(
			globalThis,
			"localStorage",
		);
		Reflect.deleteProperty(globalThis, "localStorage");

		try {
			expect(() => renderToString(<TestLayout />)).not.toThrow();
		} finally {
			if (localStorageDescriptor) {
				Object.defineProperty(
					globalThis,
					"localStorage",
					localStorageDescriptor,
				);
			}
		}
	});

	it("renders a full-height separator for a horizontal panel group", () => {
		const markup = renderToString(<TestLayout />);

		expect(markup).toContain('aria-orientation="vertical"');
		expect(markup).toContain("self-stretch");
		expect(markup).toContain("aria-[orientation=horizontal]:h-px");
	});
});
