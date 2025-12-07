import { createFileRoute } from '@tanstack/react-router'
import { OAuth2RequestError } from "arctic";
import { and, eq } from "drizzle-orm";
import { getCookies } from '@tanstack/react-start/server'

import {
	createSession,
	generateSessionToken,
	github,
	setSessionTokenCookie,
	upgradeGuestToGithub,
	getAuthSession,
} from "~/server/auth";
import { db } from "~/server/db";
import { oauthAccount, user } from "~/server/db/schema";
import type { GitHubUser } from "~/types/user";

export const Route = createFileRoute("/api/auth/callback/github")({
	// @ts-expect-error I don't know why this is erroring, but it is, seems correct...
	server: {
		handlers: {
			GET: async ({ request }: { request: Request }) => {
				const url = new URL(request.url);
				const code = url.searchParams.get("code");
				const state = url.searchParams.get("state");

				const cookies = getCookies();
				const storedState = cookies.github_oauth_state;

				if (!code || !state || !storedState || state !== storedState) {
					return new Response(null, {
						status: 400,
					});
				}

				const PROVIDER_ID = "github";

				try {
					const tokens = await github.validateAuthorizationCode(code);

					if (!tokens.accessToken()) {
						throw new Error("GitHub Callback: No access token found");
					}

					const githubUserResponse = await fetch("https://api.github.com/user", {
						headers: {
							Authorization: `Bearer ${tokens.accessToken()}`,
							Accept: "application/json",
							"User-Agent": "Fosdem PWA",
						},
					});

					if (!githubUserResponse.ok) {
						const errorText = await githubUserResponse.text();

						console.error("GitHub Callback: API Error:", {
							status: githubUserResponse.status,
							statusText: githubUserResponse.statusText,
							body: errorText,
						});

						throw new Error(
							`GitHub Callback: API Error: ${githubUserResponse.status} ${githubUserResponse.statusText}`,
						);
					}

					const providerUser: GitHubUser = await githubUserResponse.json();

					if (!providerUser.id) {
						throw new Error("GitHub Callback: No user ID found in GitHub response");
					}

					// Check if this is a guest user trying to upgrade
					const { user: currentUser } = await getAuthSession();
					if (currentUser?.is_guest) {
						await upgradeGuestToGithub(currentUser.id, providerUser);

						await db.insert(oauthAccount).values({
							provider_id: PROVIDER_ID,
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

					const userId = await db
						.insert(user)
						.values({
							email:
								providerUser.email ||
								`${providerUser.id}+${providerUser.login}@users.noreply.github.com`,
							name: providerUser.name || providerUser.login,
							avatar_url: providerUser.avatar_url,
							github_username: providerUser.login,
							company: providerUser.company,
							site: providerUser.blog,
							location: providerUser.location,
							bio: providerUser.bio,
							twitter_username: providerUser.twitter_username,
						})
						.returning({ id: user.id });

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
					console.error("GitHub Callback: Auth error:", e);
					if (e instanceof OAuth2RequestError) {
						return new Response("OAuth2 Request Error", {
							status: 400,
						});
					}
					return new Response("Internal Server Error", {
						status: 500,
					});
				}
			},
		},
	},
});
