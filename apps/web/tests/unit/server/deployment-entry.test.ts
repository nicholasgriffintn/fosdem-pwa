import { beforeEach, describe, expect, it, vi } from "vitest";

const handlers = vi.hoisted(() => ({ assets: vi.fn(), app: vi.fn() }));

vi.mock("cloudflare:workers", () => ({
	env: { ASSETS: { fetch: handlers.assets } },
}));
vi.mock("@tanstack/react-start/server", () => ({
	createStartHandler: () => handlers.app,
	defaultStreamHandler: vi.fn(),
}));

import worker from "~/server";

beforeEach(() => {
	vi.clearAllMocks();
	handlers.assets.mockResolvedValue(new Response(null, { status: 404 }));
	handlers.app.mockResolvedValue(new Response("Conference page"));
});

describe("deployment entry", () => {
	it("preserves OAuth redirects while adding indexing headers", async () => {
		handlers.app.mockResolvedValue(
			Response.redirect("https://fosdempwa.com/", 302),
		);
		const response = await worker.fetch(
			new Request("https://fosdempwa.com/api/auth/callback/github?code=123"),
		);
		expect(response.status).toBe(302);
		expect(response.headers.get("location")).toBe("https://fosdempwa.com/");
		expect(response.headers.get("X-Robots-Tag")).toBe("noindex, follow");
	});
	it("redirects before serving assets or invoking auth and page loaders", async () => {
		const response = await worker.fetch(
			new Request("https://fosdem.roomisfull.app/icons/favicon.ico"),
		);
		expect(response.status).toBe(308);
		expect(handlers.assets).not.toHaveBeenCalled();
		expect(handlers.app).not.toHaveBeenCalled();
	});

	it("serves assets on the canonical host without invoking the app", async () => {
		handlers.assets.mockResolvedValue(new Response("icon"));
		const response = await worker.fetch(
			new Request("https://fosdempwa.com/brand/icon.svg"),
		);
		expect(await response.text()).toBe("icon");
		expect(handlers.app).not.toHaveBeenCalled();
	});

	it("serves application routes with indexing disabled for personal pages", async () => {
		const response = await worker.fetch(
			new Request("https://fosdempwa.com/profile"),
		);
		expect(await response.text()).toBe("Conference page");
		expect(response.headers.get("X-Robots-Tag")).toBe("noindex, follow");
		expect(handlers.app).toHaveBeenCalledOnce();
	});
});
