import { generateCodeVerifier, generateState } from "arctic";
import type { MastodonUser, OAuthUser } from "~/types/user";
import { createMastodonInstance } from "~/server/auth";
import { Mastodon } from "~/server/lib/mastodon-arctic";
import {
  type OAuthHandler,
  fetchOAuthUserData,
  validateAccessToken,
  validateUserId,
} from "~/server/lib/oauth-handler-base";

const PROVIDER_NAME = "Mastodon";

export class MastodonOAuthHandler implements OAuthHandler {
  private mastodon: Mastodon;
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

  async handleCallback(code: string, _state: string, codeVerifier?: string): Promise<OAuthUser> {
    if (!codeVerifier) {
      throw new Error("Mastodon Callback: Missing code verifier");
    }
    const tokens = await this.mastodon.validateAuthorizationCode(code, codeVerifier);
    const accessToken = validateAccessToken(PROVIDER_NAME, tokens);

    const apiUrl = `${this.baseUrl}/api/v1/accounts/verify_credentials`;
    const mastodonUser = await fetchOAuthUserData<MastodonUser>(
      PROVIDER_NAME,
      apiUrl,
      accessToken,
    );

    validateUserId(PROVIDER_NAME, mastodonUser.id);

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
