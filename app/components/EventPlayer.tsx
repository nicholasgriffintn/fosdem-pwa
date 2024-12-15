'use client';

import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Play } from 'lucide-react';

import { Event } from '~/functions/getFosdemData';

interface EventPlayerProps {
  event: Event;
  isMobile?: boolean;
  onClose?: () => void;
  isFloating?: boolean;
}

export function EventPlayer({ event, isMobile = false, onClose, isFloating = false }: EventPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!videoRef.current || !event.streams.length || !isPlaying) return;

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

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [event.streams, isPlaying]);

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
      {!isPlaying && (
        <div
          className={`bg-${event.type} w-full h-full absolute top-0 left-0 z-0'`}
        />
      )}

      <div className={videoWrapperClassName}>
        {event.isLive && event.streams?.length ? (
          <>
            {!isPlaying && (
              <button
                onClick={handlePlay}
                className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 hover:bg-black/60 transition-colors"
              >
                <Play className="w-16 h-16 text-white" />
              </button>
            )}
            {isPlaying && (
              <video
                ref={videoRef}
                className="w-full h-full object-contain"
                controls
                autoPlay
              >
                {event.streams.map((stream) => (
                  <source
                    key={stream.href}
                    src={stream.href}
                    type={stream.type}
                  />
                ))}
              </video>
            )}
          </>
        ) : (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 transition-colors">
            <div className="p-6 relative bg-muted rounded-md">
              <span>The stream isn't available yet! Check back at {event.startTime}.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}