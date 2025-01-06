# FOSDEM PWA Companion App

This is a companion app for [FOSDEM](https://fosdem.org/), built with [TanStack Start](https://tanstack.com/start/) and using [the shadcn UI library](https://ui.shadcn.com/), it is a PWA that can be installed on your phone or desktop, or just used as a website.

It is mostly a passion project to get a chance to play with some other technologies, alongside that, I personally attend FOSDEM, a lot of the features in this app are to make my experience better, such as tracking sessions I want to attend, taking notes, and sharing my bookmarks.

Also, this project is heavily inspired by [sojourner-web](https://github.com/loomchild/sojourner-web/tree/master), so huge props to them!

## Check it out

You can check out the app at [https://fosdempwa.com/](https://fosdempwa.com/)

## Features

<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">

| ![FOSDEM PWA Homepage](./.github/docs/images/homepage.png) |
|:--:|
| **Homepage & Navigation** <br> • Quickly access scheduled tracks including Keynotes, Main tracks, Developer rooms, Lightning talks, and Other events <br> • Powerful search feature to locate events, tracks, rooms, and more <br> • Automatic data sync from FOSDEM for latest information |

| ![Event Page With Notes](./.github/docs/images/event_page_with_notes.png) |
|:--:|
| **Event Details & Note Taking** <br> • Detailed event information <br> • Capture and save session insights to through notes with timestamps <br> • GitHub sign in for a personalized experience |

| ![Room View With Status](./.github/docs/images/room_view_with_status.png) |
|:--:|
| **Room & Live Features** <br> • An events list for each room <br> • Continuous live stream view <br> • Dedicated page for live sessions |

| ![Bookmarks With Priorities](./.github/docs/images/bookmarks_with_priorities.png) |
|:--:|
| **Smart Bookmarking** <br> • Bookmark your favorite tracks and events <br> • Priority settings for conflict detection <br> • Consolidated bookmark view |

| ![Schedule With Transitions](./.github/docs/images/schedule_with_transitions.png) |
|:--:|
| **Track Management** <br> • List of events per track <br> • <ap for venue navigation <br> • Track and event sharing |

| ![Shared Profiles](./.github/docs/images/shared_profiles.png) |
|:--:|
| **User Features** <br> • Personal profile page with generated event pass <br> • Share bookmarks with others <br> • Collaborative planning capabilities |

</div>

*Data sync service deployed separately: [Build Data Repository](https://github.com/nicholasgriffintn/fosdem-pwa-build-data)*

## TODO

- [ ] Add bookmark status from DB to the event page.
- [ ] Allow users to search within specific tracks or time slots
- [ ] Maybe a calendar export? Is that too hard?
- [ ] Make Fosdem PWA a PWA again (this is mostly done but not precaching routes so only works SPA)
- [ ] Bookmarks and Notes are background synced when offline (I've not validated this yet)
- [ ] Guest sign in (potentially)
- [ ] Configure push notifications, will need a new database table (SW work has been started for this)
- [ ] Send notifications for bookmarked events (should be configurable)
- [ ] Add a track progress feature? https://capture.dropbox.com/tmn4M77IN4F7IJUl
- [ ] Maybe a visual indicator for progress?: https://capture.dropbox.com/YiTleZxrLM539GKc
- [ ] Add personalised recommendations based on bookmarks? Maybe could give users the ability to st their interests? https://capture.dropbox.com/2UZpDyZp0R2YcKDn
- [ ] Maybe we could put the events in Vectorize and then have a RAG AI suggest events? This would also include notes, would need to be personalised to the user, maybe with namespaces?

## Contributing

If you want to contribute to this project, please read the [CONTRIBUTING.md](CONTRIBUTING.md) file.
