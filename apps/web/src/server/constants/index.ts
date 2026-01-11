export const CONSTANTS = {
  CURRENT_YEAR_TTL: 60 * 30, // 30 minutes (increased from 5 for better SSR performance)
  PAST_YEAR_TTL: 60 * 60 * 24,
  DEFAULT_TTL: 60 * 60 * 24,
  FETCH_TIMEOUT_MS: 8000,
} as const;
