import type { OAuthUser } from "~/types/user";

export class OAuthApiError extends Error {
  public readonly status: number;
  public readonly statusText: string;
  public readonly body: string;

  constructor(provider: string, status: number, statusText: string, body: string) {
    super(`${provider} Callback: API Error: ${status} ${statusText}`);
    this.name = "OAuthApiError";
    this.status = status;
    this.statusText = statusText;
    this.body = body;
  }
}

export interface OAuthHandler {
  createAuthUrl(): Promise<URL>;
  handleCallback(code: string, state: string, codeVerifier?: string): Promise<OAuthUser>;
}

export async function fetchOAuthUserData<T>(
  providerName: string,
  apiUrl: string,
  accessToken: string,
  headers?: Record<string, string>,
): Promise<T> {
  const response = await fetch(apiUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      ...headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`${providerName} Callback: API Error:`, {
      status: response.status,
      statusText: response.statusText,
      body: errorText,
    });
    throw new OAuthApiError(
      providerName,
      response.status,
      response.statusText,
      errorText,
    );
  }

  return response.json();
}

export function validateAccessToken(
  providerName: string,
  tokens: { accessToken: () => string | null },
): string {
  const accessToken = tokens.accessToken();
  if (!accessToken) {
    throw new Error(`${providerName} Callback: No access token found`);
  }
  return accessToken;
}

export function validateUserId(
  providerName: string,
  userId: unknown,
): void {
  if (!userId) {
    throw new Error(`${providerName} Callback: No user ID found in response`);
  }
}
