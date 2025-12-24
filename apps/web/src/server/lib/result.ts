export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string; statusCode?: number };

export const ok = <T>(data: T): Result<T> => ({ success: true, data });

export const err = (error: string, statusCode?: number): Result<never> => ({
  success: false,
  error,
  statusCode,
});

export function isOk<T>(result: Result<T>): result is { success: true; data: T } {
  return result.success === true;
}

export function isErr<T>(result: Result<T>): result is { success: false; error: string; statusCode?: number } {
  return result.success === false;
}
