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
      body: JSON.stringify({ sql, params }),
    });

    const data = await res.json() as
      | {
        success: true;
        result: {
          results:
          | any[]
          | {
            columns: string[];
            rows: any[][];
          };
        }[];
      }
      | {
        success: false;
        errors: { code: number; message: string }[];
      };;

    if (res.status !== 200) {
      throw new Error(
        `Error from sqlite proxy server: ${res.status} ${res.statusText
        }\n${JSON.stringify(data)}`,
      );
    }

    if (!data.success) {
      throw new Error(
        data.errors.map((it) => `${it.code}: ${it.message}`).join('\n'),
      );
    }

    const result = data.result[0].results;
    const rows = Array.isArray(result) ? result : result.rows;

    return { rows };
  },
  { schema },
);