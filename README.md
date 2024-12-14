# FOSDEM PWA Companion App

This is a companion app for [FOSDEM 2024](https://fosdem.org/2024/), built with [TanStack Router](https://tanstack.com/router/) and using [the shadcn UI library](https://ui.shadcn.com/), it is a PWA that can be installed on your phone or desktop.

This is heavily inspired by [sojourner-web](https://github.com/loomchild/sojourner-web/tree/master), just in TanStack Router.

## Check it out

You can check out the app at [https://fosdempwa.com/](https://fosdempwa.com/)

## Features

- [ ] Homepage with links to the schedule tracks Keynotes, Main tracks, Developer rooms, Lightning talks, and Other events
- [ ] A page for each track with a list of events
- [ ] A page for each event with the event details
- [ ] Automated guest sign in (without needing any details)
- [ ] The ability to sign in with a previously generated guest sign in
- [ ] The ability to upgrade a guest sign in to a full account, and sign in with that instead
- [ ] A page for the user profile, with a generated pass for the event
- [ ] The ability to bookmark tracks and events
- [ ] Bookmarks are background synced when offline
- [ ] Sends push notifications for bookmarked events
- [ ] The ability to share tracks and events
- [ ] The ability to share your bookmarks
- [ ] A page to view your bookmarked tracks and events
- [ ] A page for live content with embedded video streams
- [ ] A search page

## Current Issues

- [ ] PWA is currently caching the data from Remix, which holds the bookmarked events and doesn't get cleared until a hard refresh
- [ ] API calls are not super efficient, and could be improved
- [ ] The header is not very responsive at the moment, different content could be displayed
- [ ] Logic in the lists is compelex and could be simplified
- [ ] There are a bunch of eslint and typescript issues
- [ ] Lists are not currently responsive
- [ ] Unsure if the video player looks good/ works yet
- [ ] Events and Tracks are not sorted
- [ ] The duration is currently being displayed, instead, we should display and calculate the end time from the start time and duration


## Contributing

If you want to contribute to this project, please read the [CONTRIBUTING.md](CONTRIBUTING.md) file.
