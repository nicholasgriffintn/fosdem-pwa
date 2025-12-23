import { createFileRoute } from "@tanstack/react-router";
import { getCookies } from "@tanstack/react-start/server";

import { MastodonOAuthHandler } from "~/server/mastodon-handler";
import { handleOAuthCallback } from "~/server/oauth-providers";

export const Route = createFileRoute("/api/auth/callback/mastodon")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          const url = new URL(request.url);
          const code = url.searchParams.get("code");
          const state = url.searchParams.get("state");

          const cookies = getCookies();
          const storedState = cookies.mastodon_oauth_state;
          const codeVerifier = cookies.mastodon_code_verifier;
          const instanceUrl = cookies.mastodon_instance;

          if (!code || !state || !storedState || !codeVerifier || !instanceUrl) {
            return new Response("Missing OAuth parameters", {
              status: 400,
            });
          }

          const providerConfig = {
            id: "mastodon",
            name: "Mastodon",
            scopes: ["read"],
            authUrl: "",
            callbackUrl: "",
            stateCookieName: "mastodon_oauth_state",
          };

          const mastodonHandler = new MastodonOAuthHandler(instanceUrl);

          const customHandler = {
            createAuthUrl: () => mastodonHandler.createAuthUrl(),
            handleCallback: async (code: string, _state: string) => {
              return mastodonHandler.handleCallback(code, codeVerifier);
            },
          };

          return handleOAuthCallback(
            providerConfig,
            customHandler,
            code,
            state,
            storedState,
          );
        } catch (error) {
          console.error("Mastodon Callback Error:", error);
          return new Response("Internal Server Error", {
            status: 500,
          });
        }
      },
    },
  },
});
