import type { User } from "~/server/db/schema";
import type { OAuthUser } from "~/types/user";

export type ProviderFieldMapper = (providerUser: OAuthUser) => Partial<User>;

export const PROVIDER_FIELD_MAPPINGS: Record<string, ProviderFieldMapper> = {
  github: (u) => ({
    github_username: u.login,
    company: u.company,
    site: u.blog,
    location: u.location,
    bio: u.bio,
    twitter_username: u.twitter_username,
  }),
  discord: (u) => ({
    discord_username: u.username,
  }),
  mastodon: (u) => ({
    mastodon_username: u.username,
    mastodon_acct: u.acct,
    mastodon_url: u.url,
  }),
  gitlab: (u) => ({
    gitlab_username: u.username,
    bio: u.bio,
    location: u.location,
    site: u.blog,
  }),
};

export function getProviderFields(
  providerId: string,
  providerUser: OAuthUser,
): Partial<User> {
  const mapper = PROVIDER_FIELD_MAPPINGS[providerId];
  if (!mapper) {
    return {};
  }
  return mapper(providerUser);
}

export function buildNewUserData(
  providerId: string,
  providerUser: OAuthUser,
): Partial<User> {
  return {
    email: providerUser.email,
    name: providerUser.name || providerUser.email.split("@")[0],
    avatar_url: providerUser.avatar_url,
    ...getProviderFields(providerId, providerUser),
  };
}

export function buildUpgradeUserData(
  providerId: string,
  providerUser: OAuthUser,
): Partial<User> {
  return {
    email: providerUser.email,
    name: providerUser.name || providerUser.email.split("@")[0],
    avatar_url: providerUser.avatar_url,
    is_guest: false,
    ...getProviderFields(providerId, providerUser),
  };
}
