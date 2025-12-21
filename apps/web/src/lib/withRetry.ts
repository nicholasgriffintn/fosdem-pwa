const MAX_RETRIES = 3;
const TIMEOUT_MS = 10000;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 30000;

export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES,
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        const result = await fn();
        return result;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          throw new Error("Request timed out");
        }
        throw error;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (isNonRetryableError(lastError)) {
        throw lastError;
      }

      if (attempt < retries - 1) {
        const exponentialDelay = Math.min(
          Math.pow(2, attempt) * BASE_DELAY_MS,
          MAX_DELAY_MS
        );
        const jitter = Math.random() * 0.3 * exponentialDelay;
        const delay = exponentialDelay + jitter;

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error("Max retries exceeded");
}

function isNonRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase();

  if (
    message.includes("400") ||
    message.includes("401") ||
    message.includes("403") ||
    message.includes("404") ||
    message.includes("bad request") ||
    message.includes("unauthorized") ||
    message.includes("forbidden") ||
    message.includes("not found")
  ) {
    return true;
  }

  return false;
}