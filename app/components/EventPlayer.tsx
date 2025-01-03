'use client';

import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Play } from 'lucide-react';

import type { ConferenceData, Event } from '~/types/fosdem';
import { FeaturedFosdemImage } from '~/components/FeaturedFosdemImage';
import { fosdemImageDetails } from "~/data/fosdem-image-details";

type FosdemImageType = "keynote" | "maintrack" | "devroom" | "lightningtalk" | "other";

interface EventPlayerProps {
  event: Event;
  conference: ConferenceData;
  isMobile?: boolean;
  onClose?: () => void;
  isFloating?: boolean;
}

export function EventPlayer({ event, conference, isMobile = false, onClose, isFloating = false }: EventPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const videoRecordings = event.links?.filter(link => link.type?.startsWith('video/')) || [];
  const hasRecordings = videoRecordings.length > 0;

  const isEventInPast = () => {
    try {
      const conferenceStartDate = new Date(conference.start._text);
      const eventDay = Number.parseInt(event.day as string) - 1;
      const [hours, minutes] = event.startTime.split(':').map(Number);
      const [durationHours, durationMinutes] = event.duration.split(':').map(Number);

      const eventStart = new Date(conferenceStartDate);
      eventStart.setDate(eventStart.getDate() + eventDay);
      eventStart.setHours(hours, minutes, 0);

      const eventEnd = new Date(eventStart);
      eventEnd.setHours(eventStart.getHours() + durationHours);
      eventEnd.setMinutes(eventStart.getMinutes() + durationMinutes);

      return new Date() > eventEnd;
    } catch (error) {
      console.error('Error calculating event end time:', error);
      return false;
    }
  };

  useEffect(() => {
    if (!videoRef.current || !isPlaying) return;

    if (event.isLive && event.streams?.length) {
      const stream = event.streams[0];
      if (stream.type === 'application/vnd.apple.mpegurl') {
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
  }, [event.streams, event.isLive, isPlaying]);

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const containerClassName = clsx(
    'relative w-full',
    {
      'fixed right-0 bottom-14 w-[450px] max-w-[60vw] border-l border-t border-border': isFloating,
      'aspect-video': true,
    }
  );

  const videoWrapperClassName = clsx(
    'flex items-center justify-center text-muted-foreground',
    'w-full h-full'
  );

  return (
    <div className={containerClassName}>
      {!isPlaying && !isMobile && (
        <FeaturedFosdemImage
          type={event.type as FosdemImageType}
          size="full"
          className="w-full h-full absolute top-0 left-0 z-0 object-cover"
          displayCaption={false}
        />
      )}

      <div className={videoWrapperClassName}>
        {(event.isLive && event.streams?.length) || hasRecordings ? (
          <>
            {!isPlaying && (
              <button
                type="button"
                onClick={handlePlay}
                className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/50 hover:bg-black/60 transition-colors"
              >
                <Play className="w-16 h-16 text-white" />
                <span className="text-white text-lg font-medium">Play Video</span>
              </button>
            )}
            {isPlaying && (
              // biome-ignore lint/a11y/useMediaCaption: We don't have captions for the streams
              <video
                ref={videoRef}
                className="w-full h-full object-contain"
                controls
                autoPlay
              >
                {event.isLive ? (
                  event.streams.map((stream) => (
                    <source
                      key={stream.href}
                      src={stream.href}
                      type={stream.type}
                    />
                  ))
                ) : (
                  videoRecordings.map((recording) => (
                    <source
                      key={recording.href}
                      src={recording.href}
                      type={recording.type}
                    />
                  ))
                )}
              </video>
            )}
          </>
        ) : (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 transition-colors">
            <div className="p-6 relative md:bg-muted md:rounded-md">
              <span>
                {isEventInPast()
                  ? "This event has ended and no recording is available yet, it may be available in the future."
                  : `The stream isn't available yet! Check back at ${event.startTime}.`
                }
              </span>

              {!isMobile && fosdemImageDetails[event.type as FosdemImageType] && (
                <>
                  <hr className="my-4" />
                  <span className="text-sm block mb-2">Image details: {fosdemImageDetails[event.type as FosdemImageType].alt}</span>
                  <span className="text-xs block">
                    Licensed under {fosdemImageDetails[event.type as FosdemImageType].license} •
                    <a
                      href={fosdemImageDetails[event.type as FosdemImageType].original}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-300 hover:text-blue-200 ml-1"
                    >
                      View original
                    </a>
                  </span>
                  {fosdemImageDetails[event.type as FosdemImageType].changes && (
                    <span className="text-xs block mt-1">
                      Changes: {fosdemImageDetails[event.type as FosdemImageType].changes}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}