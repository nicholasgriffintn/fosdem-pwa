import { fireEvent, render, waitFor } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi, afterEach } from "vitest";

import { ShareButton } from "~/components/shared/ShareButton";

const supportMocks = vi.hoisted(() => ({
	shareSupported: vi.fn(),
	clipboardSupported: vi.fn(),
}));

vi.mock("~/lib/browserSupport", () => supportMocks);

const toastMock = vi.fn();

const originalShare = navigator.share;
const originalCanShare = navigator.canShare;
const originalClipboard = navigator.clipboard;

vi.mock("~/hooks/use-toast", () => ({
	toast: (...args: unknown[]) => toastMock(...args),
}));

describe("ShareButton", () => {
	beforeEach(() => {
		toastMock.mockReset();
		(supportMocks.shareSupported as ReturnType<typeof vi.fn>).mockReset();
		(supportMocks.clipboardSupported as ReturnType<typeof vi.fn>).mockReset();
	});

	afterEach(() => {
		Object.defineProperty(navigator, "share", {
			value: originalShare,
			configurable: true,
		});
		Object.defineProperty(navigator, "canShare", {
			value: originalCanShare,
			configurable: true,
		});
		Object.defineProperty(navigator, "clipboard", {
			value: originalClipboard,
			configurable: true,
		});
	});

	it("uses the Web Share API when supported", async () => {
		const share = vi.fn().mockResolvedValue(undefined);
		(supportMocks.shareSupported as any).mockReturnValue(true);
		(supportMocks.clipboardSupported as any).mockReturnValue(false);
		Object.defineProperty(navigator, "canShare", {
			value: () => true,
			configurable: true,
		});
		Object.defineProperty(navigator, "share", {
			value: share,
			configurable: true,
		});

		render(
			<ShareButton
				title="Talk"
				text="Check out Talk"
				url="https://fosdem.org"
			/>,
		);

		fireEvent.click(document.querySelector("button")!);

		expect(share).toHaveBeenCalledWith({
			title: "Talk",
			text: "Check out Talk",
			url: "https://fosdem.org",
		});
	});

	it("falls back to clipboard when the share API is unavailable", () => {
		const writeText = vi.fn().mockResolvedValue(undefined);
		(supportMocks.shareSupported as any).mockReturnValue(false);
		(supportMocks.clipboardSupported as any).mockReturnValue(true);
		Object.defineProperty(navigator, "clipboard", {
			value: { writeText },
			configurable: true,
		});

		render(
			<ShareButton
				title="Talk"
				text="Check out Talk"
				url="https://fosdem.org"
			/>,
		);

		fireEvent.click(document.querySelector("button")!);

		expect(writeText).toHaveBeenCalledWith(
			"Check out Talk: https://fosdem.org",
		);
		return waitFor(() => {
			expect(toastMock).toHaveBeenCalledWith(
				expect.objectContaining({ title: "Link copied" }),
			);
		});
	});
});
