import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { PageHeader } from "~/components/shared/PageHeader";
import { FavouriteButton } from "~/components/shared/FavouriteButton";
import { ShareButton } from "~/components/shared/ShareButton";
import { WatchLaterButton } from "~/components/WatchLater/WatchLaterButton";
import { AttendanceButton } from "~/components/Event/AttendanceButton";
import { useWatchLater } from "~/hooks/use-watch-later";
import { useAttendance } from "~/hooks/use-attendance";
import { testLiveEvent, testConferenceData } from "~/data/test-data";
import { getAllData } from "~/server/functions/fosdem";
import { EventMain } from "~/components/Event/EventMain";
import { constants } from "~/constants";
import { calculateEndTime, isEventFinished, isEventLive } from "~/lib/dateTime";
import { useBookmark } from "~/hooks/use-bookmark";
import { useMutateBookmark } from "~/hooks/use-mutate-bookmark";
import { EmptyStateCard } from "~/components/shared/EmptyStateCard";
import { useIsClient } from "~/hooks/use-is-client";
import { getEventBookmark } from "~/server/functions/bookmarks";
import { generateCommonSEOTags } from "~/utils/seo-generator";
import { PageShell } from "~/components/shared/PageShell";

type BookmarkLike = {
  status?: string;
} | null;

export function resolveFavouriteStatus({
  bookmark,
  bookmarkLoading,
}: {
  bookmark: BookmarkLike;
  bookmarkLoading: boolean;
}) {
  const hasResolvedStatus = Boolean(bookmark?.status);

  if (bookmarkLoading && !hasResolvedStatus) {
    return "loading";
  }

  return bookmark?.status ?? "unfavourited";
}

export const Route = createFileRoute("/event/$slug")({
  component: EventPage,
  validateSearch: ({ test, year }: { test: boolean; year: string }) => ({
    test: test === true,
    year:
      (constants.AVAILABLE_YEARS.includes(Number(year)) && Number(year)) ||
      constants.DEFAULT_YEAR,
  }),
  loaderDeps: ({ search: { test, year } }) => ({ test, year }),
  loader: async ({ params, deps: { test, year } }) => {
    if (test) {
      return {
        fosdem: {
          event: testLiveEvent,
          conference: testConferenceData,
          track: {
            id: "radio",
            name: "Radio",
          },
          type: {
            id: "devroom",
            name: "Developer Room",
          },
        },
        year,
        isTest: true,
        serverBookmark: null,
      };
    }

    const fosdem = await getAllData({ data: { year } });

    let serverBookmark = null;
    try {
      serverBookmark = await getEventBookmark({
        data: { year, slug: params.slug },
      });
    } catch (error) {
      console.warn("Failed to load bookmark:", error);
    }

    return {
      fosdem: {
        event: fosdem.events[params.slug],
        conference: fosdem.conference,
        track: fosdem.tracks[fosdem.events[params.slug]?.trackKey],
        type: fosdem.types[fosdem.tracks[fosdem.events[params.slug]?.trackKey]?.type],
        persons: fosdem.persons,
      },
      year,
      isTest: false,
      serverBookmark,
    };
  },
  head: ({ loaderData }) => ({
    meta: [
      ...generateCommonSEOTags({
        title: loaderData?.fosdem.event?.title || "Event at FOSDEM",
        description:
          loaderData?.fosdem.event?.description ||
          loaderData?.fosdem.event?.abstract ||
          `Event at FOSDEM ${loaderData?.year} in ${loaderData?.fosdem.event?.room}`,
      }),
      {
        property: "og:type",
        content: "article",
      },
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
    ],
    scripts: loaderData?.fosdem.event
      ? [
          {
            type: "application/ld+json",
            children: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Event",
              name: loaderData.fosdem.event.title,
              description:
                loaderData.fosdem.event.description ||
                loaderData.fosdem.event.abstract ||
                "",
              startDate: `${loaderData.fosdem.conference?.start}T${loaderData.fosdem.event.startTime}:00`,
              endDate: `${loaderData.fosdem.conference?.start}T${loaderData.fosdem.event.startTime}:00`,
              location: {
                "@type": "Place",
                name: loaderData.fosdem.event.room,
              },
              organizer: {
                "@type": "Organization",
                name: "FOSDEM",
                url: "https://fosdem.org",
              },
              url: `https://fosdempwa.com/event/${loaderData.fosdem.event.id}?year=${loaderData.year}`,
              attendee: loaderData.fosdem.event.persons?.map((person: string) => ({
                "@type": "Person",
                name: person,
              })),
            }),
          },
        ]
      : [],
  }),
  staleTime: 1000 * 60 * 5, // 5 minutes
});

function EventPage() {
  const { fosdem, year, isTest, serverBookmark } = Route.useLoaderData();
  const isClient = useIsClient();
  const headerSentinelRef = useRef<HTMLDivElement | null>(null);
  const [showStickyTitle, setShowStickyTitle] = useState(false);
  const [referenceTime, setReferenceTime] = useState<Date | null>(null);

  const { bookmark, loading: bookmarkLoading } = useBookmark({
    year,
    slug: fosdem?.event?.id,
  });
  const { create: createBookmark } = useMutateBookmark({ year });
  const { toggle: toggleWatchLater } = useWatchLater({ year });
  const { markAttended, unmarkAttended } = useAttendance({ year });
  const onCreateBookmark = async (bookmark: any) => {
    await createBookmark(bookmark);
  };

  const currentBookmark = isClient ? bookmark : serverBookmark;
  const isBookmarked = currentBookmark?.status === "favourited";
  const isInWatchLater = currentBookmark?.watch_later === true;
  const isAttended = currentBookmark?.attended === true;
  const isAttendedInPerson = currentBookmark?.attended_in_person === true;
  const currentBookmarkId = currentBookmark?.id;
  const eventFinished = fosdem.event && fosdem.conference && referenceTime
    ? isEventFinished(fosdem.event, fosdem.conference, referenceTime)
    : false;
  const eventLive = fosdem.event && fosdem.conference && referenceTime
    ? isEventLive(fosdem.event, fosdem.conference, referenceTime)
    : false;
  const canMarkAttendance = eventFinished || eventLive;
  const favouriteStatus = isClient
    ? resolveFavouriteStatus({
        bookmark,
        bookmarkLoading,
      })
    : serverBookmark?.status ?? "unfavourited";

  useEffect(() => {
    if (!isClient) {
      return;
    }
    setReferenceTime(new Date());
    const el = headerSentinelRef.current;
    if (!el) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickyTitle(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [isClient]);

  if (!fosdem.event?.title || !fosdem.conference) {
    return (
      <PageShell maxWidth="none">
        <PageHeader heading="Event not found" />
        <EmptyStateCard
          title="Whoops!"
          description="We couldn't find this event. It may have been removed or the link is incorrect."
        />
      </PageShell>
    );
  }

  return (
    <PageShell maxWidth="none">
      <PageHeader
        heading={fosdem.event.title}
        year={year}
        breadcrumbs={[
          { title: fosdem.type?.name, href: `/type/${fosdem.type?.id}` },
          {
            title: fosdem.track?.name,
            href: fosdem.track?.id
              ? `/track/${encodeURIComponent(fosdem.track.id)}`
              : "#",
          },
        ]}
        subtitle={fosdem.event.subtitle}
        metadata={[
          {
            text: `${fosdem.event.room}`,
            href: `/rooms/${fosdem.event.room}`,
          },
          {
            text: `Day ${fosdem.event.day}`,
          },
          {
            text: `${fosdem.event.startTime} - ${calculateEndTime(
              fosdem.event.startTime,
              fosdem.event.duration
            )}`,
          },
          {
            text: `Speakers: ${fosdem.event.persons?.join(", ")}`,
          },
        ]}
        additionalHeadingPaddingClass="h-0 md:h-6"
      >
        <div className="hidden md:flex items-center md:pl-6 md:pr-3 gap-2">
          <FavouriteButton
            year={year}
            type="event"
            slug={fosdem?.event?.id}
            status={favouriteStatus}
            onCreateBookmark={onCreateBookmark}
          />
          {eventFinished && (
            <>
              <WatchLaterButton
                bookmarkId={currentBookmarkId ?? ""}
                isInWatchLater={isInWatchLater}
                onToggle={toggleWatchLater}
                variant="icon"
                disabled={!isBookmarked || !currentBookmarkId}
              />
            </>
          )}
          {canMarkAttendance && (
              <AttendanceButton
                bookmarkId={currentBookmarkId ?? ""}
                isAttended={isAttended}
                isInPerson={isAttendedInPerson}
                onMarkAttended={markAttended}
                onUnmarkAttended={unmarkAttended}
                disabled={!isBookmarked || !currentBookmarkId}
              />
          )}
          <ShareButton
            title={fosdem?.event?.title}
            text={`Check out ${fosdem?.event?.title} at FOSDEM`}
            url={`https://fosdempwa.com/event/${fosdem?.event?.id}?year=${year}`}
          />
        </div>
      </PageHeader>
      <div ref={headerSentinelRef} />
      <div className="sticky top-14 z-12 -mx-4 px-4 py-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b md:hidden">
        <div className={`flex items-center transition-all duration-300 ease-out ${showStickyTitle ? "gap-3" : "gap-0"}`}>
          <div
            className={`min-w-0 overflow-hidden transition-all duration-300 ease-out ${showStickyTitle ? "flex-1 opacity-100" : "w-0 flex-none opacity-0"
              }`}
          >
            <span className="block text-sm font-medium text-foreground truncate">
              {fosdem.event.title}
            </span>
          </div>
          <div
            className={`flex items-center transition-all duration-300 ease-out ${showStickyTitle ? "gap-2 shrink-0" : "gap-2 flex-1"
              }`}
          >
            <FavouriteButton
              year={year}
              type="event"
              slug={fosdem?.event?.id}
              status={favouriteStatus}
              onCreateBookmark={onCreateBookmark}
              className={showStickyTitle ? undefined : "flex-1 w-full"}
            />
            {eventFinished && (
              <>
                <WatchLaterButton
                  bookmarkId={currentBookmarkId ?? ""}
                  isInWatchLater={isInWatchLater}
                  onToggle={toggleWatchLater}
                  variant="icon"
                  disabled={!isBookmarked || !currentBookmarkId}
                  className={showStickyTitle ? undefined : "flex-1 w-full"}
                />
              </>
            )}
            {canMarkAttendance && (
              <AttendanceButton
                bookmarkId={currentBookmarkId ?? ""}
                isAttended={isAttended}
                isInPerson={isAttendedInPerson}
                onMarkAttended={markAttended}
                onUnmarkAttended={unmarkAttended}
                disabled={!isBookmarked || !currentBookmarkId}
                className={showStickyTitle ? undefined : "flex-1 w-full"}
              />
            )}
            <ShareButton
              title={fosdem?.event?.title}
              text={`Check out ${fosdem?.event?.title} at FOSDEM`}
              url={`https://fosdempwa.com/event/${fosdem?.event?.id}?year=${year}`}
              className={showStickyTitle ? undefined : "flex-1 w-full"}
            />
          </div>
        </div>
      </div>
      <div className="w-full mt-4 md:mt-0">
        <EventMain
          event={fosdem.event}
          conference={fosdem.conference}
          year={year}
          isTest={isTest}
          referenceTime={referenceTime}
          persons={fosdem.persons}
        />
      </div>
    </PageShell>
  );
}
