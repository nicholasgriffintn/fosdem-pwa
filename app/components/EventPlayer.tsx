"use client";

import clsx from "clsx";
import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import { Play } from "lucide-react";

import type { ConferenceData, Event } from "~/types/fosdem";
import { FeaturedFosdemImage } from "~/components/FeaturedFosdemImage";
import type { FosdemImageType } from "~/types/fosdem";

interface EventPlayerProps {
  event: Event;
  conference: ConferenceData;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isMobile?: boolean;
  onClose?: () => void;
  isFloating?: boolean;
}

const getEventTiming = (event: Event, conference: ConferenceData) => {
  try {
    const conferenceStartDate = new Date(conference.start._text);
    const eventDay = Number.parseInt(event.day as string) - 1;
    const [hours, minutes] = event.startTime.split(":").map(Number);
    const [durationHours, durationMinutes] = event.duration.split(":").map(Number);

    const eventStart = new Date(conferenceStartDate);
    eventStart.setDate(eventStart.getDate() + eventDay);
    eventStart.setHours(hours, minutes, 0);

    const eventEnd = new Date(eventStart);
    eventEnd.setHours(eventStart.getHours() + durationHours);
    eventEnd.setMinutes(eventStart.getMinutes() + durationMinutes);

    return {
      start: eventStart,
      end: eventEnd,
      date: eventStart.toISOString().substring(0, 10)
    };
  } catch (error) {
    console.error("Error calculating event timing:", error);
    return null;
  }
};

export function EventPlayer({
  event,
  conference,
  videoRef,
  isMobile = false,
  onClose,
  isFloating = false,
}: EventPlayerProps) {
  const hlsRef = useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const videoRecordings =
    event.links?.filter((link) => link.type?.startsWith("video/")) || [];
  const hasRecordings = videoRecordings.length > 0;

  const BUFFER_MINUTES = 15;

  const isEventLive = () => {
    const timing = getEventTiming(event, conference);
    if (!timing) return false;

    const now = new Date();
    const bufferStart = new Date(timing.start);
    const bufferEnd = new Date(timing.end);

    bufferStart.setMinutes(bufferStart.getMinutes() - BUFFER_MINUTES);
    bufferEnd.setMinutes(bufferEnd.getMinutes() + BUFFER_MINUTES);

    return now >= bufferStart && now <= bufferEnd;
  };

  const eventIsLive = isEventLive();

  const isEventInPast = useCallback(() => {
    const timing = getEventTiming(event, conference);
    if (!timing) return false;
    return new Date() > timing.end;
  }, [event, conference]);

  const eventIsInPast = isEventInPast();

  useEffect(() => {
    if (!videoRef.current || !isPlaying) return;

    if (eventIsLive && event.streams?.length) {
      const stream = event.streams[0];
      if (stream.type === "application/vnd.apple.mpegurl") {
        if (Hls.isSupported()) {
          const hls = new Hls();
          hlsRef.current = hls;
          hls.attachMedia(videoRef.current);
          hls.on(Hls.Events.MEDIA_ATTACHED, () => {
            hls.loadSource(stream.href);
          });
        }
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [event.streams, isPlaying, videoRef.current, eventIsLive]);

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const containerClassName = clsx("relative w-full", {
    "fixed right-0 bottom-14 w-[450px] max-w-[60vw] border-l border-t border-border":
      isFloating,
    "aspect-video": true,
  });

  const videoWrapperClassName = clsx(
    "flex items-center justify-center text-muted-foreground",
    "w-full h-full",
  );

  return (
    <div className={containerClassName}>
      {!isPlaying && (
        <FeaturedFosdemImage
          type={event.type as FosdemImageType}
          size="full"
          className="w-full h-full absolute top-0 left-0 z-0 object-cover"
          displayCaption={false}
        />
      )}

      <div className={videoWrapperClassName}>
        {(eventIsLive && event.streams?.length) || hasRecordings ? (
          <>
            {!isPlaying && (
              <button
                type="button"
                onClick={handlePlay}
                className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/50 hover:bg-black/60 transition-colors"
              >
                <Play className="w-16 h-16 text-white" />
                <span className="text-white text-lg font-medium">
                  Play Video
                </span>
              </button>
            )}
            {isPlaying && (
              // biome-ignore lint/a11y/useMediaCaption: We don't have captions for the streams
              <video
                ref={videoRef}
                className="w-full h-full object-contain"
                controls
                autoPlay
                playsInline
                webkit-playsinline="true"
              >
                {eventIsLive && event.streams?.length
                  ? event.streams.map((stream) => (
                    <source
                      key={stream.href}
                      src={stream.href}
                      type={stream.type}
                    />
                  ))
                  : videoRecordings.map((recording) => (
                    <source
                      key={recording.href}
                      src={recording.href}
                      type={recording.type}
                    />
                  ))}
              </video>
            )}
          </>
        ) : (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 transition-colors">
            <div className="p-4 md:p-6 mx-2 relative bg-muted rounded-md">
              <span className="text-sm md:text-base">
                {eventIsInPast
                  ? "This event has ended and no recording is available yet, it may be available in the future."
                  : `The stream isn't available yet! Check back at ${event.startTime}.`}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
