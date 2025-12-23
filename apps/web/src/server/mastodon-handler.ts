import { generateCodeVerifier, generateState } from "arctic";
import type { MastodonUser, OAuthUser } from "~/types/user";
import { createMastodonInstance } from "~/server/auth";

export class MastodonOAuthHandler {
  private mastodon: any;
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.mastodon = createMastodonInstance(baseUrl);
  }

  async createAuthUrl(): Promise<URL> {
    const state = generateState();
    const codeVerifier = generateCodeVerifier();
    const scopes = ["read"];

    return this.mastodon.createAuthorizationURL(state, codeVerifier, scopes);
  }

  async handleCallback(code: string, codeVerifier?: string): Promise<OAuthUser> {
    if (!codeVerifier) {
      throw new Error("Mastodon Callback: Missing code verifier");
    }
    const tokens = await this.mastodon.validateAuthorizationCode(code, codeVerifier);

    if (!tokens.accessToken()) {
      throw new Error("Mastodon Callback: No access token found");
    }

    const mastodonUserResponse = await fetch(
      `${this.baseUrl}/api/v1/accounts/verify_credentials`,
      {
        headers: {
          Authorization: `Bearer ${tokens.accessToken()}`,
          Accept: "application/json",
        },
      },
    );

    if (!mastodonUserResponse.ok) {
      const errorText = await mastodonUserResponse.text();

      console.error("Mastodon Callback: API Error:", {
        status: mastodonUserResponse.status,
        statusText: mastodonUserResponse.statusText,
        body: errorText,
        baseUrl: this.baseUrl,
      });

      throw new Error(
        `Mastodon Callback: API Error: ${mastodonUserResponse.status} ${mastodonUserResponse.statusText}`,
      );
    }

    const mastodonUser: MastodonUser = await mastodonUserResponse.json();

    if (!mastodonUser.id) {
      throw new Error(
        "Mastodon Callback: No user ID found in Mastodon response",
      );
    }

    const baseUrlId = this.baseUrl.replace("https://", "").replace("http://", "");
    const email = `${baseUrlId}-${mastodonUser.id}@noreply.fosdempwa.com`;

    return {
      id: mastodonUser.id,
      email: email,
      name: mastodonUser.display_name || mastodonUser.username,
      avatar_url: mastodonUser.avatar,
      username: mastodonUser.username,
      acct: mastodonUser.acct,
      url: mastodonUser.url,
    };
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }
}
