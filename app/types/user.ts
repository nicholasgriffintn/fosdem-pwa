export interface User {
  id: number;
  name: string;
  avatar_url: string;
  email: string;
  github_username: string;
  company?: string;
  site?: string;
  location?: string;
  bio?: string;
  twitter_username?: string;
}