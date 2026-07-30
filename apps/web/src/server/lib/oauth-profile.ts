import { isRecord, type ExternalIdentity } from "@ngriffin_uk/auth-core";

import type { OAuthUser } from "~/types/user";

export interface FosdemOAuthProfile extends OAuthUser {
	readonly emailVerified: boolean;
	readonly upgradeUserId?: number;
}

export function oauthProfile(identity: ExternalIdentity): FosdemOAuthProfile {
	const value = identity.claims["profile"];
	if (!isFosdemOAuthProfile(value)) {
		throw new TypeError("The OAuth provider returned an invalid profile.");
	}
	return value;
}

function isFosdemOAuthProfile(value: unknown): value is FosdemOAuthProfile {
	if (!isRecord(value)) {
		return false;
	}
	return (
		typeof value.id === "string" &&
		typeof value.email === "string" &&
		typeof value.emailVerified === "boolean" &&
		(value.upgradeUserId === undefined ||
			(typeof value.upgradeUserId === "number" &&
				Number.isSafeInteger(value.upgradeUserId)))
	);
}
