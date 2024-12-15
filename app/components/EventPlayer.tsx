import clsx from 'clsx';
import { useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { Icons } from '~/components/Icons';
interface Stream {
  href: string;
  title: string;
  type: string;
}

interface EventPlayerProps {
  event: any;
  isMobile?: boolean;
  onClose?: () => void;
  isFloating?: boolean;
}

export function EventPlayer({ event, isMobile = false, onClose, isFloating = false }: EventPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    if (!videoRef.current || !event.streams.length) return;

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
  }, [event.streams]);

  const containerClassName = clsx(
    'relative h-full',
    {
      'fixed right-0 bottom-14 w-[450px] max-w-[60vw] border-l border-t border-border': isFloating,
      'min-h-[340px] rounded-md': isMobile,
      'min-h-[640px]': !isMobile && !isFloating,
    }
  );

  const videoWrapperClassName = clsx(
    'flex items-center justify-center text-muted-foreground relative',
    'aspect-video w-full h-full'
  );

  return (
    <div className={containerClassName}>
      {!event.isLive && (
        <div
          className={`bg-${event.type} w-full h-full absolute top-0 left-0 z-0'`}
        />
      )}

      <div className={videoWrapperClassName}>
        {event.isLive && event.streams?.length ? (
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
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
        ) : (
          <div className="p-6 relative bg-muted rounded-md">
            <span>Sorry! The stream isn't available yet!</span>
          </div>
        )}
      </div>
    </div>
  );
}