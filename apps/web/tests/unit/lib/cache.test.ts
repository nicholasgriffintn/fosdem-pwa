import { describe, expect, it, vi, beforeEach } from "vitest";

const redisMocks = vi.hoisted(() => {
	const redisFns = {
		get: vi.fn(),
		set: vi.fn(),
		del: vi.fn(),
	};
	const RedisMock = vi.fn(function RedisMock() {
		return redisFns;
	});
	return { redisFns, Redis: RedisMock };
});

vi.mock("@upstash/redis", () => redisMocks);

const { redisFns, Redis: RedisMock } = redisMocks;

const mockEnv: Record<string, string | undefined> = {};

vi.mock("~/server/config", () => ({
	getCloudflareEnv: () => mockEnv,
}));

import { CacheManager } from "~/lib/cache";
import { Redis } from "@upstash/redis";

describe("CacheManager", () => {
	beforeEach(() => {
		Object.keys(mockEnv).forEach((key) => {
			delete mockEnv[key];
		});
		redisFns.get.mockReset();
		redisFns.set.mockReset();
		redisFns.del.mockReset();
		RedisMock.mockClear();
		vi.clearAllMocks();
	});

	it("operates in no-op mode when redis env vars are missing", async () => {
		mockEnv.REDIS_ENABLED = "false";

		const manager = new CacheManager();

		expect(Redis).not.toHaveBeenCalled();
		expect(await manager.get("key")).toBeNull();
		await manager.set("key", { test: true });
		await manager.invalidate("key");

		expect(redisFns.get).not.toHaveBeenCalled();
		expect(redisFns.set).not.toHaveBeenCalled();
		expect(redisFns.del).not.toHaveBeenCalled();
	});

	it("creates a redis client when env vars are present", async () => {
		mockEnv.REDIS_ENABLED = "true";
		mockEnv.UPSTASH_REDIS_URL = "https://example.com";
		mockEnv.UPSTASH_REDIS_TOKEN = "token";

		const manager = new CacheManager();
		expect(Redis).toHaveBeenCalledWith({
			url: "https://example.com",
			token: "token",
		});

		redisFns.get.mockResolvedValueOnce('{"value":42}');
		const cached = await manager.get("rooms");
		expect(redisFns.get).toHaveBeenCalledWith("fosdem:rooms");
		expect(cached).toEqual({ value: 42 });

		await manager.set("rooms", { value: 1 }, 30);
		expect(redisFns.set).toHaveBeenCalledWith("fosdem:rooms", '{"value":1}', {
			ex: 30,
		});

		await manager.invalidate("rooms");
		expect(redisFns.del).toHaveBeenCalledWith("fosdem:rooms");
	});

	it("handles redis get() network errors gracefully", async () => {
		mockEnv.REDIS_ENABLED = "true";
		mockEnv.UPSTASH_REDIS_URL = "https://example.com";
		mockEnv.UPSTASH_REDIS_TOKEN = "token";

		const manager = new CacheManager();
		const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		redisFns.get.mockRejectedValueOnce(new Error("Network error"));

		const result = await manager.get("test-key");

		expect(result).toBeNull();
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			"Redis get error for key test-key:",
			expect.any(Error)
		);

		consoleErrorSpy.mockRestore();
	});

	it("handles redis set() network errors gracefully", async () => {
		mockEnv.REDIS_ENABLED = "true";
		mockEnv.UPSTASH_REDIS_URL = "https://example.com";
		mockEnv.UPSTASH_REDIS_TOKEN = "token";

		const manager = new CacheManager();
		const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		redisFns.set.mockRejectedValueOnce(new Error("Network error"));

		await manager.set("test-key", { data: "test" });

		expect(consoleErrorSpy).toHaveBeenCalledWith(
			"Redis set error for key test-key:",
			expect.any(Error)
		);

		consoleErrorSpy.mockRestore();
	});

	it("handles redis invalidate() network errors gracefully", async () => {
		mockEnv.REDIS_ENABLED = "true";
		mockEnv.UPSTASH_REDIS_URL = "https://example.com";
		mockEnv.UPSTASH_REDIS_TOKEN = "token";

		const manager = new CacheManager();
		const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		redisFns.del.mockRejectedValueOnce(new Error("Network error"));

		await manager.invalidate("test-key");

		expect(consoleErrorSpy).toHaveBeenCalledWith(
			"Redis invalidate error for key test-key:",
			expect.any(Error)
		);

		consoleErrorSpy.mockRestore();
	});

	it("handles JSON parse errors when getting cached data", async () => {
		mockEnv.REDIS_ENABLED = "true";
		mockEnv.UPSTASH_REDIS_URL = "https://example.com";
		mockEnv.UPSTASH_REDIS_TOKEN = "token";

		const manager = new CacheManager();

		redisFns.get.mockResolvedValueOnce("invalid json{");

		const result = await manager.get("test-key");

		expect(result).toBe("invalid json{");
	});

	it("handles connection timeouts without crashing", async () => {
		mockEnv.REDIS_ENABLED = "true";
		mockEnv.UPSTASH_REDIS_URL = "https://example.com";
		mockEnv.UPSTASH_REDIS_TOKEN = "token";

		const manager = new CacheManager();
		const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		const timeoutError = new Error("Request timeout");
		timeoutError.name = "TimeoutError";
		redisFns.get.mockRejectedValueOnce(timeoutError);

		const result = await manager.get("test-key");

		expect(result).toBeNull();
		expect(consoleErrorSpy).toHaveBeenCalled();

		consoleErrorSpy.mockRestore();
	});
});
