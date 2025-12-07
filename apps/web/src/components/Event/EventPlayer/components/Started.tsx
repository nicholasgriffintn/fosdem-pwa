import { useEffect, useState, useRef } from "react";
import Hls from "hls.js";

import { Icons } from "~/components/Icons";
import type { Event } from "~/types/fosdem";

export function EventPlayerStarted({
  event, videoRef, isPlaying, setIsPlaying, eventIsLive
}: { event: Event, videoRef: React.RefObject<HTMLVideoElement | null>, isPlaying: boolean, setIsPlaying: (value: boolean) => void, eventIsLive: boolean }) {
  const hlsRef = useRef<Hls | null>(null);
  const [streamError, setStreamError] = useState(false);

  const subtitleTrack = event.links?.find((link) => link.href.endsWith(".vtt"));
  const proxiedSubtitleUrl = subtitleTrack
    ? `/api/proxy/subtitles?url=${encodeURIComponent(subtitleTrack.href)}`
    : null;

  const videoRecordings =
    event.links?.filter((link) => link.type?.startsWith("video/")) || [];

  useEffect(() => {
    if (!videoRef.current || !isPlaying) return;

    if (eventIsLive && event.streams?.length) {
      const hlsStream = event.streams.find(
        (stream) => stream.type === "application/vnd.apple.mpegurl",
      );

      if (hlsStream && Hls.isSupported()) {
        const hls = new Hls();
        hlsRef.current = hls;
        hls.attachMedia(videoRef.current);

        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          hls.loadSource(hlsStream.href);
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            setStreamError(true);
          }
        });
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [event.streams, isPlaying, videoRef, eventIsLive]);

  const handlePlay = () => {
    setIsPlaying(true);
    setStreamError(false);
  };

  return (
    <>
      {!isPlaying && (
        <button
          type="button"
          onClick={handlePlay}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/50 hover:bg-black/60 transition-colors"
        >
          <Icons.play className="w-16 h-16 text-white" />
          <span className="text-white text-lg font-medium">
            Play Video
          </span>
        </button>
      )}
      {isPlaying && !streamError && (
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
          {proxiedSubtitleUrl && (
            <track
              kind="subtitles"
              src={proxiedSubtitleUrl}
              srcLang="en"
              label="English"
              default
            />
          )}
        </video>
      )}
      {streamError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50">
          <div className="p-4 md:p-6 mx-2 relative bg-muted rounded-md">
            <span className="text-sm md:text-base">
              {eventIsLive
                ? "The live stream is currently unavailable. Please try again later."
                : "There was an error playing the recording. Please try again later."}
            </span>
          </div>
        </div>
      )}
    </>
  );
}