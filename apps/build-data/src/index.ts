import * as Sentry from "@sentry/cloudflare";

import type { BuildDataResult } from "./types.js";
import { buildData } from "./lib/fosdem";
import { createLogger } from "./lib/logger";

const DEFAULT_YEAR = 2026;
const MIN_YEAR = 2000;
const MAX_YEAR = 2100;

type ParsedYear = { value: number; source: "env" | "default"; clamped: boolean };

const parseYear = (value: string | null | undefined): ParsedYear => {
  const parsed = Number.parseInt(value ?? "", 10);

  if (!Number.isFinite(parsed)) {
    return { value: DEFAULT_YEAR, source: "default", clamped: false };
  }

  const clamped = Math.min(MAX_YEAR, Math.max(MIN_YEAR, parsed));
  return {
    value: clamped,
    source: "env",
    clamped: clamped !== parsed,
  };
};

const resolveYear = (env: Env): ParsedYear => {
  const fromEnv = env.YEAR ?? env.DEFAULT_YEAR ?? env.BUILD_YEAR;
  return parseYear(fromEnv);
};

const validateBuildData = (data: BuildDataResult) => {
  if (!data || typeof data !== "object") {
    throw new Error("Generated data payload is empty");
  }

  const requiredKeys: Array<keyof BuildDataResult> = [
    "conference",
    "events",
    "tracks",
    "rooms",
    "days",
    "types",
    "buildings",
  ];

  for (const key of requiredKeys) {
    if (!(key in data)) {
      throw new Error(`Generated data missing "${key}" section`);
    }
  }

  if (!Object.keys(data.events ?? {}).length) {
    throw new Error("Generated data contains no events");
  }
};

const toHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

const computeEtag = async (payload: string): Promise<string> => {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(payload));
  return `W/"${toHex(hash)}"`;
};

const run = async (env: Env) => {
  const year = resolveYear(env);
  const yearString = year.value.toString();
  const logger = createLogger({
    scope: "worker",
    year: yearString,
    requestId: crypto.randomUUID(),
  });

  logger.info("Starting build", {
    year: yearString,
    source: year.source,
    clamped: year.clamped,
  });

  const data = await buildData({ year: yearString });
  validateBuildData(data);

  const shouldMinify = year.value >= 2026;
  const serialized = JSON.stringify(data);

  if (!serialized.length) {
    logger.error("Generated payload was empty");
    throw new Error("Generated data payload is empty");
  }

  const etag = await computeEtag(serialized);
  const key = `fosdem-${yearString}.json`;

  logger.info("Serialized data", {
    minified: shouldMinify,
    size: serialized.length,
    etag,
    key
  });

  await env.R2.put(key, serialized, {
    httpMetadata: {
      contentType: "application/json",
      cacheControl: "public, max-age=600",
    },
    customMetadata: {
      year: yearString,
      etag,
    },
  });

  logger.info("Uploaded build data to R2", { key });

  return data;
};

export default Sentry.withSentry(
  (env: Env) => ({
    dsn: "https://828f2b60a22b55556e8be6aa87517acf@o4508599344365568.ingest.de.sentry.io/4508734045814864",
    tracesSampleRate: 1.0,
  }),
  {
    async fetch(request, env, ctx): Promise<Response> {
      const data = await run(env);

      return Response.json(data);
    },
    async scheduled(event: any, env: any, ctx: any) {
      ctx.waitUntil(run(env));
    },
  } satisfies ExportedHandler<Env>
);
