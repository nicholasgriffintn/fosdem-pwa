import clsx from "clsx";
import { getResizedImageSrc } from "~/utils/image-resize";

import { Icons } from "~/components/Icons";

type MediaSource = {
  href: string;
  type: string;
};

type NoJsVideoFallbackProps = {
  sources: MediaSource[];
  openUrl: string;
  subtitleUrl?: string | null;
  backgroundImageUrl?: string;
  className?: string;
  videoClassName?: string;
  preload?: "none" | "metadata" | "auto";
};

export function NoJsVideoFallback({
  sources,
  openUrl,
  subtitleUrl,
  backgroundImageUrl = "/fosdem/images/fosdem/full/fallback.png",
  className,
  videoClassName,
  preload = "none",
}: NoJsVideoFallbackProps) {
  const resizedBackgroundImageUrl = getResizedImageSrc(backgroundImageUrl, 1920, 1080);

  return (
    <div
      className={clsx(
        "relative w-full h-full overflow-hidden",
        "bg-black bg-cover bg-center",
        className
      )}
      style={{
        backgroundImage: backgroundImageUrl
          ? `url(${resizedBackgroundImageUrl})`
          : undefined,
      }}
    >
      <video
        className={clsx("w-full h-full object-contain", "bg-transparent", videoClassName)}
        controls
        playsInline
        preload={preload}
        poster={resizedBackgroundImageUrl}
      >
        {sources.map((source) => (
          <source key={source.href} src={source.href} type={source.type} />
        ))}
        {subtitleUrl && (
          <track
            kind="subtitles"
            src={subtitleUrl}
            srcLang="en"
            label="English"
            default
          />
        )}
        Your browser does not support HTML5 video.
      </video>

      <a
        href={openUrl}
        target="_blank"
        rel="noreferrer"
        className={clsx(
          "no-underline",
          "absolute top-2 right-2 z-10",
          "inline-flex items-center gap-1",
          "rounded-md bg-black/60 px-2 py-1",
          "text-xs font-medium text-white hover:bg-black/80"
        )}
        title="Open in browser"
        aria-label="Open in browser"
      >
        <Icons.externalLink className="w-3.5 h-3.5" />
        <span className="whitespace-nowrap">Open in browser</span>
      </a>
    </div>
  );
}
