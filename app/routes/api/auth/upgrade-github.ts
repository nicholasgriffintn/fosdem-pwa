import { createAPIFileRoute } from "@tanstack/start/api";
import { github } from "~/server/auth";
import { setCookie } from "vinxi/http";

export const APIRoute = createAPIFileRoute("/api/auth/upgrade-github")({
  GET: async () => {
    try {
      const state = crypto.randomUUID();
      const url = await github.createAuthorizationURL(state, ["user:email"]);

      setCookie("github_oauth_state", state, {
        path: "/",
        secure: process.env.NODE_ENV !== "development",
        httpOnly: true,
        maxAge: 60 * 10, // 10 minutes
        sameSite: "lax",
      });

      return new Response(null, {
        status: 302,
        headers: {
          Location: url.toString(),
        },
      });
    } catch (error) {
      console.error("GitHub Upgrade Error:", error);
      return new Response("Internal Server Error", {
        status: 500,
      });
    }
  },
}); 