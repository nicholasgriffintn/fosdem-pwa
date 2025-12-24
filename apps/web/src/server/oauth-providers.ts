import { generateState } from "arctic";
import { setCookie } from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";
import { and, eq } from "drizzle-orm";
import { OAuth2RequestError } from "arctic";

import { db } from "~/server/db";
import { oauthAccount, user } from "~/server/db/schema";
import {
  createSession,
  generateSessionToken,
  setSessionTokenCookie,
  getAuthSession,
} from "~/server/auth";
import type { OAuthUser } from "~/types/user";
import type { OAuthHandler } from "~/server/lib/oauth-handler-base";
import {
  buildNewUserData,
  buildUpgradeUserData,
} from "~/server/lib/provider-mapping";
import {
  findUserByEmail,
  upgradeGuestUser as upgradeGuestUserRepo,
} from "~/server/repositories/user-repository";

export interface ProviderConfig {
  id: string;
  name: string;
  scopes: string[];
  authUrl: string;
  callbackUrl: string;
  stateCookieName: string;
}

export type { OAuthHandler } from "~/server/lib/oauth-handler-base";

export async function createOAuthRedirect(provider: ProviderConfig) {
  const state = generateState();
  const url = new URL(provider.authUrl);

  setCookie(provider.stateCookieName, state, {
    path: "/",
    secure: env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: "lax",
  });

  return new Response(null, {
    status: 302,
    headers: {
      Location: url.toString(),
    },
  });
}

export async function handleOAuthCallback(
  provider: ProviderConfig,
  handler: OAuthHandler,
  code: string,
  state: string,
  storedState: string,
) {
  if (!code || !state || !storedState || state !== storedState) {
    return new Response(null, {
      status: 400,
    });
  }

  try {
    const providerUser = await handler.handleCallback(code, state);
    const { user: currentUser } = await getAuthSession();

    if (currentUser?.is_guest) {
      await upgradeGuestUser(currentUser.id, providerUser, provider.id);

      await db.insert(oauthAccount).values({
        provider_id: provider.id,
        provider_user_id: providerUser.id,
        user_id: currentUser.id,
      });

      return new Response(null, {
        status: 302,
        headers: {
          Location: "/",
        },
      });
    }

    const existingAccount = await db.query.oauthAccount.findFirst({
      where: and(
        eq(oauthAccount.provider_id, provider.id),
        eq(oauthAccount.provider_user_id, providerUser.id),
      ),
    });

    if (existingAccount?.user_id) {
      const token = generateSessionToken();
      const session = await createSession(token, existingAccount.user_id);
      setSessionTokenCookie(token, new Date(session.expires_at));
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/",
        },
      });
    }

    let existingUserEmail = null;
    // Skip email-based linking for Mastodon as it uses fabricated emails
    if (providerUser.email && provider.id !== 'mastodon') {
      existingUserEmail = await findUserByEmail(providerUser.email);
    }

    if (existingUserEmail?.id) {
      await db.insert(oauthAccount).values({
        provider_id: provider.id,
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

    const userId = await createNewUser(providerUser, provider.id);

    const token = generateSessionToken();
    const session = await createSession(token, userId);
    setSessionTokenCookie(token, new Date(session.expires_at));
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/",
      },
    });
  } catch (e) {
    console.error(`${provider.name} Callback: Auth error:`, e);
    if (e instanceof OAuth2RequestError) {
      return new Response("OAuth2 Request Error", {
        status: 400,
      });
    }
    return new Response("Internal Server Error", {
      status: 500,
    });
  }
}

async function createNewUser(providerUser: OAuthUser, providerId: string): Promise<number> {
  const providerFields = buildNewUserData(providerId, providerUser);

  const userId = await db
    .insert(user)
    .values({
      email: providerUser.email,
      name: providerUser.name || providerUser.email.split("@")[0],
      avatar_url: providerUser.avatar_url,
      ...providerFields,
    })
    .returning({ id: user.id });

  await db.insert(oauthAccount).values({
    provider_id: providerId,
    provider_user_id: providerUser.id,
    user_id: userId[0].id,
  });

  return userId[0].id;
}

async function upgradeGuestUser(userId: number, providerUser: OAuthUser, providerId: string) {
  const userData = buildUpgradeUserData(providerId, providerUser);
  await upgradeGuestUserRepo(userId, userData);
}
