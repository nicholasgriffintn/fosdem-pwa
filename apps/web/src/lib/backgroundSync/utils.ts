import type { ServerActionResult } from "./types";

export function normalizeServerActionResult(
  response: unknown,
  fallbackError = "Unknown error",
): ServerActionResult {
  if (response && typeof response === "object" && "success" in response) {
    const result = response as ServerActionResult;
    return {
      success: Boolean(result.success),
      error: result.error ?? (result.success ? undefined : fallbackError),
      statusCode: result.statusCode,
    };
  }

  return { success: false, error: fallbackError };
}