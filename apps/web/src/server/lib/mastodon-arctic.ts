import { OAuth2Client, CodeChallengeMethod } from "arctic";
import type { OAuth2Tokens } from "arctic";

export function trimLeft(s: string, character: string): string {
  if (character.length !== 1) {
    throw new TypeError("Invalid character string");
  }
  let start = 0;
  while (start < s.length && s[start] === character) {
    start++;
  }
  return s.slice(start);
}

export function trimRight(s: string, character: string): string {
  if (character.length !== 1) {
    throw new TypeError("Invalid character string");
  }
  let end = s.length;
  while (end > 0 && s[end - 1] === character) {
    end--;
  }
  return s.slice(0, end);
}


export function joinURIAndPath(base: string, ...path: string[]): string {
  let joined = trimRight(base, "/");
  for (const part of path) {
    joined = trimRight(joined, "/") + "/" + trimLeft(part, "/");
  }
  return joined;
}

export class Mastodon {
  private authorizationEndpoint: string;
  private tokenEndpoint: string;
  private tokenRevocationEndpoint: string;

  private client: OAuth2Client;

  constructor(baseURL: string, clientId: string, clientSecret: string, redirectURI: string) {
    this.authorizationEndpoint = joinURIAndPath(baseURL, 'oauth/authorize');
    this.tokenEndpoint = joinURIAndPath(baseURL, '/oauth/token');
    this.tokenRevocationEndpoint = joinURIAndPath(baseURL, '/oauth/revoke');
    this.client = new OAuth2Client(clientId, clientSecret, redirectURI);
  }

  public createAuthorizationURL(state: string, codeVerifier: string, scopes: string[]): URL {
    const url = this.client.createAuthorizationURLWithPKCE(
      this.authorizationEndpoint,
      state,
      CodeChallengeMethod.S256,
      codeVerifier,
      scopes
    );
    return url;
  }

  public async validateAuthorizationCode(
    code: string,
    codeVerifier: string
  ): Promise<OAuth2Tokens> {
    const tokens = await this.client.validateAuthorizationCode(
      this.tokenEndpoint,
      code,
      codeVerifier
    );
    return tokens;
  }

  public async revokeToken(token: string): Promise<void> {
    await this.client.revokeToken(this.tokenRevocationEndpoint, token);
  }
}
