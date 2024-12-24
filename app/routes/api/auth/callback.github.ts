import { createAPIFileRoute } from "@tanstack/start/api";
import { OAuth2RequestError } from "arctic";
import { and, eq } from "drizzle-orm";
import { parseCookies } from "vinxi/http";
import {
  createSession,
  generateSessionToken,
  github,
  setSessionTokenCookie,
} from "~/server/auth";
import { db } from "~/server/db";
import { oauthAccount, user } from "~/server/db/schema";

interface GitHubUser {
  id: string;
  name: string | null;
  email: string;
  avatar_url: string;
  location: string | null;
  login: string;
  company: string | null;
  blog: string | null;
  bio: string | null;
  twitter_username: string | null;
}

export const APIRoute = createAPIFileRoute("/api/auth/callback/github")({
  GET: async ({ request }) => {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    const cookies = parseCookies();
    const storedState = cookies.github_oauth_state;

    if (!code || !state || !storedState || state !== storedState) {
      return new Response(null, {
        status: 400,
      });
    }

    const PROVIDER_ID = "github";

    try {
      const tokens = await github.validateAuthorizationCode(code);
      const githubUserResponse = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${tokens.accessToken()}`,
        },
      });
      const providerUser: GitHubUser = await githubUserResponse.json();

      const existingUser = await db.query.oauthAccount.findFirst({
        where: and(
          eq(oauthAccount.provider_id, PROVIDER_ID),
          eq(oauthAccount.provider_user_id, providerUser.id),
        ),
      });

      if (existingUser?.user_id) {
        const token = generateSessionToken();
        const session = await createSession(token, existingUser.user_id);
        setSessionTokenCookie(token, new Date(session.expires_at));
        return new Response(null, {
          status: 302,
          headers: {
            Location: "/",
          },
        });
      }

      const existingUserEmail = await db.query.user.findFirst({
        where: eq(user.email, providerUser.email),
      });

      if (existingUserEmail?.id) {
        await db.insert(oauthAccount).values({
          provider_id: PROVIDER_ID,
          provider_user_id: providerUser.id,
          user_id: existingUserEmail.id,
        });
        const token = generateSessionToken();
        const session = await createSession(token, existingUserEmail.id);
        setSessionTokenCookie(token, new Date(session.expires_at));
        return new Response(null, {
          status: 302,
          headers: {
            Location: "/",
          },
        });
      }

      const userId = await db.insert(user).values({
        email: providerUser.email,
        name: providerUser.name || providerUser.login,
        avatar_url: providerUser.avatar_url,
        github_username: providerUser.login,
        company: providerUser.company,
        site: providerUser.blog,
        location: providerUser.location,
        bio: providerUser.bio,
        twitter_username: providerUser.twitter_username,
      }).returning({ id: user.id });

      if (!userId[0].id) {
        return new Response(null, {
          status: 500,
        });
      }

      await db.insert(oauthAccount).values({
        provider_id: PROVIDER_ID,
        provider_user_id: providerUser.id,
        user_id: userId[0].id,
      });

      const token = generateSessionToken();
      const session = await createSession(token, userId[0].id);
      setSessionTokenCookie(token, new Date(session.expires_at));
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/",
        },
      });
    } catch (e) {
      console.error(e);
      if (e instanceof OAuth2RequestError) {
        return new Response(null, {
          status: 400,
        });
      }
      return new Response(null, {
        status: 500,
      });
    }
  },
});