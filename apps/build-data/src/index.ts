import * as Sentry from "@sentry/cloudflare";

import type { BuildDataResult } from "./types.js";
import { buildData } from "./lib/fosdem";
import { createLogger } from "./lib/logger";
import { ensureYearFiles, uploadYearFiles } from "./lib/year-files";

const DEFAULT_YEAR = 2027;
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

  const template = await ensureYearFiles(env.R2, yearString, logger);
  let data: BuildDataResult;

  try {
    data = await buildData({ year: yearString });
    validateBuildData(data);
  } catch (error) {
    if (template) {
      logger.warn("Schedule unavailable; retaining template year files", {
        error: (error as Error)?.message,
      });
      return template;
    }

    throw error;
  }

  await uploadYearFiles(env.R2, data, yearString, logger);

  return data;
};

export default Sentry.withSentry<Env, unknown>(
  (env) => ({
    dsn: "https://07aa95ea691d47e198b5c3b291501895@ingest.bitwobbly.com/7",
    sampleRate: 1,
    enableLogs: false,
    tracesSampleRate: 0,
    beforeSend(event) {
      return event.exception?.values?.length ? event : null;
    },
    beforeSendTransaction() {
      return null;
    },
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
