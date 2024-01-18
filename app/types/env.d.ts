export interface Env {
  R2?: R2Bucket;
  KV: KVNamespace;
  FOSDEM_SECRET: string;
  SESSION_SECRET: string;
  NODE_ENV: string;
}
