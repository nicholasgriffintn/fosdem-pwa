export interface GitLabUser {
  id: number;
  username: string;
  name: string;
  email: string;
  avatar_url: string;
  web_url: string;
  bio: string | null;
  location: string | null;
  website_url: string | null;
  state: string;
  created_at: string;
}
