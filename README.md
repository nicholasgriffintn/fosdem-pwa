# FOSDEM PWA Companion App

This is a companion app for [FOSDEM 2024](https://fosdem.org/2024/), built with [TanStack Start](https://tanstack.com/start/) and using [the shadcn UI library](https://ui.shadcn.com/), it is a PWA that can be installed on your phone or desktop.

This is heavily inspired by [sojourner-web](https://github.com/loomchild/sojourner-web/tree/master), just in TanStack Router.

## Check it out

You can check out the app at [https://fosdempwa.com/](https://fosdempwa.com/)

## Features

- [x] Homepage with links to the schedule tracks Keynotes, Main tracks, Developer rooms, Lightning talks, and Other events
- [x] A page for each track with a list of events
- [x] A page for each event with the event details
- [x] GitHub sign in
- [x] A page for the user profile, with a generated pass for the event
- [x] The ability to bookmark tracks and events
- [x] The ability to share tracks and events
- [x] The ability to share your bookmarks
- [x] A page to view your bookmarked tracks and events
- [x] A page for finding live events
- [x] A map page
- [x] A search page
- [x] Data synced automatically from FOSDEM on a schedule, deployed separately [here](https://github.com/nicholasgriffintn/fosdem-pwa-build-data)

## TODO

- [ ] Add a feature for note taking potentially?
This would show in the sidebar instead of the summary that's currently there, summary would just display below now. On mobile, would maybe show in a modal?

Should record the time that the note was started and saved based on the video timestamp.

Should record the note in the database and then display it in the sidebar as a list.
- [ ] Add bookmark status from DB to the event page.
- [ ] Allow users to search within specific tracks or time slots
- [ ] Organise bookmarks by day and time, allow for filtering potentially.
- [ ] Display events below bookmarked tracks
- [ ] Potentially add a calendar view of bookmarked events, maybe a calendar export?
- [ ] Make Fosdem PWA a PWA again (this is mostly done but not precaching routes so only works SPA)
- [ ] Bookmarks are background synced when offline
- [ ] Guest sign in (potentially)
- [ ] Configure push notifications, will need a new database table
- [ ] Send notifications for bookmarked events (should be configurable)
- [ ] Add a track progress feature? https://capture.dropbox.com/tmn4M77IN4F7IJUl
- [ ] Maybe a visual indicator for progress?: https://capture.dropbox.com/YiTleZxrLM539GKc
- [ ] Add personalised recommendations based on bookmarks? Maybe could give users the ability to st their interests? https://capture.dropbox.com/2UZpDyZp0R2YcKDn
- [ ] Maybe we could put the events in Vectorize and then have a RAG AI suggest events? This would also include notes, would need to be personalised to the user, maybe with namespaces?
- [ ] Add a room page (should show tracks and events in that room): https://fosdem.org/2025/schedule/room/k4201/, page might be able to show the single stream?

## Contributing

If you want to contribute to this project, please read the [CONTRIBUTING.md](CONTRIBUTING.md) file.
