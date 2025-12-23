import { createFileRoute } from "@tanstack/react-router";
import { getCookies } from "@tanstack/react-start/server";

import { DiscordOAuthHandler } from "~/server/discord-handler";
import { handleOAuthCallback } from "~/server/oauth-providers";

const discordHandler = new DiscordOAuthHandler();

export const Route = createFileRoute("/api/auth/callback/discord")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");

        const cookies = getCookies();
        const storedState = cookies.discord_oauth_state;

        const providerConfig = {
          id: "discord",
          name: "Discord",
          scopes: ["identify", "email"],
          authUrl: "",
          callbackUrl: "",
          stateCookieName: "discord_oauth_state",
        };

        if (!code || !state) {
          return new Response(null, {
            status: 400,
          });
        }

        return handleOAuthCallback(
          providerConfig,
          discordHandler,
          code,
          state,
          storedState,
        );
      },
    },
  },
});
