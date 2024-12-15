import { drizzle } from "drizzle-orm/sqlite-proxy";

import * as schema from "./schema";

export const runtime = "edge";

export const db = drizzle(
  async (sql: unknown, params: unknown, method: string) => {
    const url = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID
      }/d1/database/${process.env.CLOUDFLARE_DATABASE_ID}/${method === "values" ? "raw" : "query"
      }`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_D1_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql, params, method }),
    });

    const data: {
      success: boolean;
      errors: string[];
      result: {
        success: boolean;
        results: { [key: string]: any }[];
      }[];
    } = await res.json();

    if (res.status !== 200) {
      throw new Error(
        `Error from sqlite proxy server: ${res.status} ${res.statusText
        }\n${JSON.stringify(data)}`,
      );
    }

    if (data.errors.length > 0 || !data.success) {
      throw new Error(
        `Error from sqlite proxy server: \n${JSON.stringify(data)}}`,
      );
    }

    const qResult = data.result[0];

    if (!qResult?.success) {
      throw new Error(
        `Error from sqlite proxy server: \n${JSON.stringify(data)}`,
      );
    }

    // https://orm.drizzle.team/docs/get-started-sqlite#http-proxy
    return { rows: qResult?.results?.map((r: any) => Object.values(r)) };
  },
  { schema },
);