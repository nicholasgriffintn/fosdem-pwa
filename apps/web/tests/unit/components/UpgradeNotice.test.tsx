import {
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { UpgradeNotice } from "~/components/shared/UpgradeNotice";

const originalShowModal = Object.getOwnPropertyDescriptor(
	HTMLDialogElement.prototype,
	"showModal",
);
const originalClose = Object.getOwnPropertyDescriptor(
	HTMLDialogElement.prototype,
	"close",
);

describe("UpgradeNotice", () => {
	beforeAll(() => {
		Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
			configurable: true,
			value(this: HTMLDialogElement) {
				this.setAttribute("open", "");
			},
		});
		Object.defineProperty(HTMLDialogElement.prototype, "close", {
			configurable: true,
			value(this: HTMLDialogElement) {
				this.removeAttribute("open");
				this.dispatchEvent(new Event("close"));
			},
		});
	});

	afterAll(() => {
		restoreDialogMethod("showModal", originalShowModal);
		restoreDialogMethod("close", originalClose);
	});

	it("opens the styled Mastodon options in the shared modal", async () => {
		const fetchMock = vi
			.spyOn(globalThis, "fetch")
			.mockResolvedValue(Response.json({ status: "completed" }));
		render(<UpgradeNotice user={{ is_guest: true }} />);

		const dialog = screen.getByRole("dialog", { hidden: true });
		expect(dialog).not.toHaveAttribute("open");

		fireEvent.click(screen.getByRole("button", { name: /^mastodon$/i }));

		expect(dialog).toHaveAttribute("open");
		expect(dialog).toHaveClass("max-w-md");
		expect(within(dialog).getByLabelText(/mastodon server/i)).toHaveClass(
			"w-full",
		);
		expect(
			within(dialog).getByRole("button", {
				name: /^upgrade with mastodon$/i,
			}),
		).toHaveClass("bg-primary");

		fireEvent.change(within(dialog).getByLabelText(/mastodon server/i), {
			target: { value: "mastodon.social" },
		});
		fireEvent.click(
			within(dialog).getByRole("button", {
				name: /^upgrade with mastodon$/i,
			}),
		);

		await waitFor(() => {
			expect(fetchMock).toHaveBeenCalledWith("/api/auth", {
				body: JSON.stringify({
					action: "start_oauth",
					provider: "mastodon",
					values: {
						server: "mastodon.social",
						upgrade: "true",
					},
				}),
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				method: "POST",
			});
		});

		fireEvent.click(within(dialog).getByRole("button", { name: /^cancel$/i }));
		expect(dialog).not.toHaveAttribute("open");
	});
});

function restoreDialogMethod(
	name: "close" | "showModal",
	descriptor: PropertyDescriptor | undefined,
): void {
	if (descriptor) {
		Object.defineProperty(HTMLDialogElement.prototype, name, descriptor);
		return;
	}
	delete HTMLDialogElement.prototype[name];
}
