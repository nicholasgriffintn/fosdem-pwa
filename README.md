# FOSDEM PWA Companion App

This is a companion app for [FOSDEM 2024](https://fosdem.org/2024/), built with [Remix](https://remix.run) and using [the shadcn UI library](https://ui.shadcn.com/), it is a PWA that can be installed on your phone or desktop.

This is heavily inspired by [sojourner-web](https://github.com/loomchild/sojourner-web/tree/master), just in Remix.

## Check it out

You can check out the app at [https://fosdempwa.com/](https://fosdempwa.com/)

## Features

- [x] Homepage with links to the schedule tracks Keynotes, Main tracks, Developer rooms, Lightning talks, and Other events
- [x] A page for each track with a list of events
- [x] A page for each event with the event details
- [ ] Automated guest sign in (without needing any details)
- [ ] The ability to sign in with a previously generated guest sign in
- [ ] The ability to upgrade a guest sign in to a full account, and sign in with that instead
- [ ] A page for the user profile, with a generated pass for the event
- [x] The ability to bookmark tracks and events
- [ ] The ability to share tracks and events
- [ ] The ability to share your bookmarks
- [ ] A page to view your bookmarked tracks and events
- [ ] A page for live content with embedded video streams
- [ ] A search page

## Current Issues

- [ ] PWA is currently caching the data from Remix, which holds the bookmarked events and doesn't get cleared until a hard refresh
- [ ] API calls are not super efficient, and could be improved

## Contributing

If you want to contribute to this project, please read the [CONTRIBUTING.md](CONTRIBUTING.md) file.
