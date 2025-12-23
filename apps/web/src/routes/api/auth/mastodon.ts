import { createFileRoute } from "@tanstack/react-router";
import { generateState, generateCodeVerifier } from "arctic";
import { setCookie } from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";

import { createMastodonInstance, MASTODON_INSTANCES } from "~/server/auth";

export const Route = createFileRoute("/api/auth/mastodon")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          const url = new URL(request.url);
          const server = url.searchParams.get("server");

          if (!server) {
            return new Response(JSON.stringify(MASTODON_INSTANCES), {
              status: 200,
              headers: {
                "Content-Type": "application/json",
              },
            });
          }

          const instance = MASTODON_INSTANCES.find(
            (instance) => instance.name === server || instance.baseUrl === server
          );

          if (!instance) {
            return new Response("Invalid Mastodon instance", {
              status: 400,
            });
          }

          const state = generateState();
          const codeVerifier = generateCodeVerifier();

          const mastodon = createMastodonInstance(instance.baseUrl);
          const authUrl = mastodon.createAuthorizationURL(state, codeVerifier, ["read"]);

          setCookie("mastodon_oauth_state", state, {
            path: "/",
            secure: env.NODE_ENV === "production",
            httpOnly: true,
            maxAge: 60 * 10,
            sameSite: "lax",
          });

          setCookie("mastodon_code_verifier", codeVerifier, {
            path: "/",
            secure: env.NODE_ENV === "production",
            httpOnly: true,
            maxAge: 60 * 10,
            sameSite: "lax",
          });

          setCookie("mastodon_instance", instance.baseUrl, {
            path: "/",
            secure: env.NODE_ENV === "production",
            httpOnly: true,
            maxAge: 60 * 10,
            sameSite: "lax",
          });

          return new Response(null, {
            status: 302,
            headers: {
              Location: authUrl.toString(),
            },
          });
        } catch (error) {
          console.error("Mastodon Sign In Error:", error);
          return new Response("Internal Server Error", {
            status: 500,
          });
        }
      },
    },
  },
});
