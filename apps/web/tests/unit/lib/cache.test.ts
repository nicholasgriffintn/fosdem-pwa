import { describe, expect, it, vi, beforeEach } from "vitest";

const { mockKV, mockEnv } = vi.hoisted(() => {
  const mockKV = {
    get: vi.fn(),
    getWithMetadata: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };
  const mockEnv: {
    KV: typeof mockKV | null;
    KV_CACHING_ENABLED: string;
  } = {
    KV: mockKV,
    KV_CACHING_ENABLED: "false",
  };
  return { mockKV, mockEnv };
});

vi.mock("cloudflare:workers", () => ({
  env: mockEnv,
}));

import { CacheManager } from "~/server/cache";

describe("CacheManager", () => {
  beforeEach(() => {
    CacheManager.resetInstance();
    mockEnv.KV_CACHING_ENABLED = "false";
    mockKV.get.mockReset();
    mockKV.getWithMetadata.mockReset();
    mockKV.put.mockReset();
    mockKV.delete.mockReset();
    vi.clearAllMocks();
  });

  it("uses memory cache when KV caching is disabled", async () => {
    mockEnv.KV_CACHING_ENABLED = "false";
    vi.useFakeTimers();

    const manager = new CacheManager();

    expect(await manager.get("mem-key")).toBeNull();

    await manager.set("mem-key", { local: true });

    expect(await manager.get("mem-key")).toEqual({ local: true });

    expect(mockKV.get).not.toHaveBeenCalled();
    expect(mockKV.put).not.toHaveBeenCalled();

    await manager.invalidate("mem-key");
    expect(await manager.get("mem-key")).toBeNull();

    vi.useRealTimers();
  });

  it("respects TTL in memory cache", async () => {
    mockEnv.KV_CACHING_ENABLED = "false";
    vi.useFakeTimers();

    const manager = new CacheManager();

    await manager.set("ttl-key", { data: "fresh" }, 10);

    expect(await manager.get("ttl-key")).toEqual({ data: "fresh" });

    vi.advanceTimersByTime(11000);

    expect(await manager.get("ttl-key")).toBeNull();

    vi.useRealTimers();
  });

  it("updates memory cache even when KV is enabled", async () => {
    mockEnv.KV_CACHING_ENABLED = "true";
    vi.useFakeTimers();

    const manager = new CacheManager();

    await manager.set("dual-key", { dual: true });

    expect(mockKV.put).toHaveBeenCalledWith(
      "fosdem:dual-key",
      '{"dual":true}',
      expect.anything(),
    );

    mockEnv.KV_CACHING_ENABLED = "false";

    const mapSpy = vi.spyOn(Map.prototype, "set");
    await manager.set("spy-key", { checked: true });

    expect(mapSpy).toHaveBeenCalledWith(
      "fosdem:spy-key",
      expect.objectContaining({ data: { checked: true } }),
    );

    mapSpy.mockRestore();
    vi.useRealTimers();
  });

  it("uses KV when enabled", async () => {
    mockEnv.KV_CACHING_ENABLED = "true";

    const manager = new CacheManager();

    mockKV.get.mockResolvedValueOnce(JSON.stringify({ value: 42 }));
    const cached = await manager.get("rooms");
    expect(mockKV.get).toHaveBeenCalledWith("fosdem:rooms");
    expect(cached).toEqual({ value: 42 });

    await manager.set("rooms", { value: 1 }, 30);
    expect(mockKV.put).toHaveBeenCalledWith("fosdem:rooms", '{"value":1}', {
      expirationTtl: 30,
    });

    await manager.invalidate("rooms");
    expect(mockKV.delete).toHaveBeenCalledWith("fosdem:rooms");
  });

  it("handles KV get() network errors gracefully", async () => {
    mockEnv.KV_CACHING_ENABLED = "true";

    const manager = new CacheManager();
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    mockKV.get.mockRejectedValueOnce(new Error("Network error"));

    const result = await manager.get("test-key");

    expect(result).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "KV get error for key test-key:",
      expect.any(Error),
    );

    consoleErrorSpy.mockRestore();
  });

  it("handles KV put() network errors gracefully", async () => {
    mockEnv.KV_CACHING_ENABLED = "true";

    const manager = new CacheManager();
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    mockKV.put.mockRejectedValueOnce(new Error("Network error"));

    await manager.set("test-key", { data: "test" });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "KV set error for key test-key:",
      expect.any(Error),
    );

    consoleErrorSpy.mockRestore();
  });

  it("handles KV delete() network errors gracefully", async () => {
    mockEnv.KV_CACHING_ENABLED = "true";

    const manager = new CacheManager();
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    mockKV.delete.mockRejectedValueOnce(new Error("Network error"));

    await manager.invalidate("test-key");

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "KV invalidate error for key test-key:",
      expect.any(Error),
    );

    consoleErrorSpy.mockRestore();
  });

  it("handles JSON parse errors when getting cached data", async () => {
    mockEnv.KV_CACHING_ENABLED = "true";

    const manager = new CacheManager();

    mockKV.get.mockResolvedValueOnce("invalid json{");

    const result = await manager.get("test-key");

    expect(result).toBe("invalid json{");
  });

  describe("stale-while-revalidate", () => {
    it("setWithSoftExpiry stores data with soft and hard expiry in memory cache", async () => {
      mockEnv.KV_CACHING_ENABLED = "false";
      vi.useFakeTimers();

      const manager = new CacheManager();

      await manager.setWithSoftExpiry("swr-key", { data: "test" }, 60);

      const result = await manager.getWithStaleness("swr-key");
      expect(result).not.toBeNull();
      expect(result?.data).toEqual({ data: "test" });
      expect(result?.isStale).toBe(false);

      vi.useRealTimers();
    });

    it("getWithStaleness returns isStale=true after soft expiry", async () => {
      mockEnv.KV_CACHING_ENABLED = "false";
      vi.useFakeTimers();

      const manager = new CacheManager();

      await manager.setWithSoftExpiry("swr-key", { data: "test" }, 60);

      vi.advanceTimersByTime(61000);

      const result = await manager.getWithStaleness("swr-key");
      expect(result).not.toBeNull();
      expect(result?.data).toEqual({ data: "test" });
      expect(result?.isStale).toBe(true);

      vi.useRealTimers();
    });

    it("getWithStaleness returns null after hard expiry", async () => {
      mockEnv.KV_CACHING_ENABLED = "false";
      vi.useFakeTimers();

      const manager = new CacheManager();

      await manager.setWithSoftExpiry("swr-key", { data: "test" }, 60);

      vi.advanceTimersByTime(60 * 4 * 1000 + 1000);

      const result = await manager.getWithStaleness("swr-key");
      expect(result).toBeNull();

      vi.useRealTimers();
    });

    it("setWithSoftExpiry uses KV when enabled with metadata", async () => {
      mockEnv.KV_CACHING_ENABLED = "true";
      vi.useFakeTimers();

      const manager = new CacheManager();

      await manager.setWithSoftExpiry("swr-kv-key", { data: "test" }, 60);

      expect(mockKV.put).toHaveBeenCalledWith(
        "fosdem:swr-kv-key",
        '{"data":"test"}',
        expect.objectContaining({
          expirationTtl: 240,
          metadata: expect.objectContaining({
            softExpiresAt: expect.any(Number),
          }),
        }),
      );

      vi.useRealTimers();
    });

    it("getWithStaleness reads metadata from KV to determine staleness", async () => {
      mockEnv.KV_CACHING_ENABLED = "true";
      vi.useFakeTimers();

      const manager = new CacheManager();
      const now = Date.now();

      mockKV.getWithMetadata = vi.fn().mockResolvedValueOnce({
        value: '{"data":"cached"}',
        metadata: { softExpiresAt: now - 1000 },
      });

      const result = await manager.getWithStaleness("stale-key");

      expect(result).not.toBeNull();
      expect(result?.data).toEqual({ data: "cached" });
      expect(result?.isStale).toBe(true);

      vi.useRealTimers();
    });

    it("getWithStaleness returns isStale=false when metadata indicates fresh", async () => {
      mockEnv.KV_CACHING_ENABLED = "true";
      vi.useFakeTimers();

      const manager = new CacheManager();
      const now = Date.now();

      mockKV.getWithMetadata = vi.fn().mockResolvedValueOnce({
        value: '{"data":"fresh"}',
        metadata: { softExpiresAt: now + 60000 },
      });

      const result = await manager.getWithStaleness("fresh-key");

      expect(result).not.toBeNull();
      expect(result?.data).toEqual({ data: "fresh" });
      expect(result?.isStale).toBe(false);

      vi.useRealTimers();
    });

    it("getWithStaleness returns null when KV value is missing", async () => {
      mockEnv.KV_CACHING_ENABLED = "true";

      const manager = new CacheManager();

      mockKV.getWithMetadata = vi.fn().mockResolvedValueOnce({
        value: null,
        metadata: null,
      });

      const result = await manager.getWithStaleness("missing-key");

      expect(result).toBeNull();
    });
  });
});
