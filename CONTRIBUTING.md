# Contributing

I'm more than happy to accept contributions to this project, so please feel free to open issues or pull requests.

Before you do though, please read the [Code of Conduct](CODE_OF_CONDUCT.md) and the rest of this document.

## Useful links

- [FOSDEM](https://fosdem.org/)

## Testing

- `pnpm test` runs the Vitest unit suite.
- `pnpm test:watch` keeps Vitest open for TDD.
- `pnpm test:e2e` runs the Playwright journeys defined under `tests/playwright`. The config automatically starts the dev server on port `4173` (override with `PLAYWRIGHT_BASE_URL`/`PLAYWRIGHT_PORT`). Make sure `@playwright/test` browsers are installed via `pnpm exec playwright install`.

The Playwright suite follows the Page Object Model:

- `tests/playwright/pages/HomePage.ts`, `SearchPage.ts`, `SignInPage.ts` encapsulate UI sections.
- Specs live in `tests/playwright/specs` and focus on high-level flows (homepage content, search discoverability, and auth entry-points).

## Cloudflare Worker Previews

Use Worker Previews for remote branch testing. They require Wrangler 4.135.0 or newer; the workspace pins a compatible version. Authenticate with `pnpm --filter @fosdem-pwa/web exec wrangler login` before publishing a Preview.

### Configure Preview secrets

Preview settings and secrets are not inherited from production. Before publishing the first Preview, run `pnpm exec wrangler preview base-config secret put <NAME>` from each app directory.

- Set `CRON_SECRET` for both web and push, using the same value.
- Set `VAPID_EMAIL`, `VAPID_PUBLIC_KEY`, and `VAPID_PRIVATE_KEY` for push.
- Set `BUILD_TRIGGER_SECRET` for build-data.

Base secrets are applied when a Preview is created. For an existing Preview, set each secret with `pnpm exec wrangler preview secret put <NAME> --name <name>`, or delete and recreate the Preview. Do not commit secret values.

### Protect and enable Preview URLs

Configure Cloudflare Access before enabling Preview URLs. In each Worker's Cloudflare dashboard, protect previews with a Worker-level **Previews only** Access policy, then enable the one-time **Worker URL > Preview** toggle.

The repository sets `preview_urls` to `true`, so a production deployment can apply the URL setting instead of using the dashboard toggle. Keep Access protection in place because enabled Preview URLs are otherwise public.

### Publish and remove a Preview

Wrangler uses the current branch name by default. Supply an explicit name when you need a stable Preview across repeated deployments.

- `pnpm preview` builds and publishes the web app Preview.
- `pnpm --filter @fosdem-pwa/push preview` publishes the push Worker Preview.
- `pnpm --filter @fosdem-pwa/build-data preview` publishes the data builder Preview.
- Add `--name <name>` to choose a Preview name explicitly. Reusing the name updates the existing Preview.
- Delete a Preview from its app directory with `pnpm exec wrangler preview delete --name <name> --skip-confirmation`.

### Preview resources and limitations

Preview storage is isolated from production but shared by every Preview name and branch. Web and push share the preview D1 database, web uses the preview KV namespace, build-data uses the preview R2 bucket, and push uses the preview Analytics Engine dataset and queue. Avoid destructive tests that could disrupt another active Preview.

Worker Previews do not run scheduled triggers, and push Previews cannot consume queue messages. Push can publish to the non-production queue, but no Preview consumer will deliver those notifications.

Web Preview test notifications are intentionally disabled by the `preview.invalid` push URL until a protected push Preview URL is supplied explicitly. Even then, the Preview queue has no consumer and cannot deliver notifications.

Trigger a build-data Preview manually with an authenticated `POST` request:

```sh
curl --request POST \
  --header "Authorization: Bearer ${BUILD_TRIGGER_SECRET}" \
  --header "CF-Access-Client-Id: ${CF_ACCESS_CLIENT_ID}" \
  --header "CF-Access-Client-Secret: ${CF_ACCESS_CLIENT_SECRET}" \
  "${BUILD_DATA_PREVIEW_URL}"
```

The Access headers require a service token allowed by the Preview policy. For an interactive login, send the same request through `cloudflared access curl` instead.
