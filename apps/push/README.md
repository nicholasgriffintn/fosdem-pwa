# Room is Full — Push Notifications Service

This an individual service designed to send push notifications to users when they have are bookmarks that are starting soon.

Select the conference with its Wrangler environment. Dates, timezone, message names, data URLs and app links come from `@roomisfull/conference`. Use a separate database and queue per conference, and set `CRON_SECRET` for manual HTTP triggers. Run `pnpm build --env fosdem` for a dry run. See the [root README](../../README.md#deploy) for deployment setup.
