export interface GitHubUser {
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

export interface DiscordUser {
	id: string;
	username: string;
	discriminator: string;
	global_name: string | null;
	avatar_url: string | null;
	email: string;
	verified: boolean;
}

export interface MastodonUser {
	id: string;
	username: string;
	acct: string;
	display_name: string;
	avatar: string;
	avatar_static: string;
	url: string;
	locked: boolean;
	created_at: string;
	last_status_at: string | null;
	followers_count: number;
	following_count: number;
	statuses_count: number;
	source?: {
		note: string;
		fields: any[];
		privacy: string;
		sensitive: boolean;
		language: string;
	};
}

export interface OAuthProvider {
	id: string;
	name: string;
	scopes: string[];
}

export interface OAuthUser {
	id: string;
	email: string;
	name?: string | null;
	avatar_url?: string | null;
	login?: string;
	username?: string;
	company?: string | null;
	blog?: string | null;
	location?: string | null;
	bio?: string | null;
	twitter_username?: string | null;
	discriminator?: string;
	acct?: string;
	url?: string;
}
