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

Use `pnpm preview` to build and publish a remote web Preview for the current branch. Pass `--name <name>` to choose a name, or run `pnpm exec wrangler preview delete --name <name>` from `apps/web` to remove it. Run `pnpm --filter @fosdem-pwa/web exec wrangler login` first if Wrangler is not authenticated.

Before the first Preview, protect the web Worker's Preview URLs with Cloudflare Access, then enable **Worker URL > Preview** in the Cloudflare dashboard. The Preview uses the existing `fosdem-preview` D1 database, shared across branch Previews, instead of production D1. OAuth and test notifications are disabled until dedicated Preview integrations are configured.
