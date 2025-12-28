"use client";

import { Link } from "@tanstack/react-router";
import clsx from "clsx";

import { Icons } from "~/components/shared/Icons";
import { usePlayer } from "~/contexts/PlayerContext";
import { buildEventLink } from "~/lib/link-builder";
import { useWatchLater } from "~/hooks/use-watch-later";
import { WatchLaterButton } from "~/components/WatchLater/WatchLaterButton";
import { PlaybackSpeedControl } from "~/components/WatchLater/PlaybackSpeedControl";

export function FloatingPlayer() {
	const {
		currentEvent,
		year,
		isMinimized,
		minimize,
		restore,
		close,
		portalTarget,
		videoRef,
		isLive,
		bookmark,
	} = usePlayer();

	const yearNum = year ?? new Date().getFullYear();
	const { toggle: toggleWatchLater } = useWatchLater({ year: yearNum });

	const handleSpeedChange = (speed: number) => {
		if (videoRef.current) {
			videoRef.current.playbackRate = speed;
		}
	};

	const currentSpeed = videoRef.current?.playbackRate ?? 1;

	const shouldShow = currentEvent && year && portalTarget === "floating";

	const containerClassName = clsx(
		"fixed z-50 transition-all duration-300 ease-in-out",
		{
			"bottom-14 right-4 w-80 h-12 bg-background border border-border rounded-lg shadow-xl overflow-hidden":
				isMinimized && shouldShow,
			"bottom-14 right-4 w-[450px] max-w-[60vw] aspect-video border border-border rounded-lg shadow-2xl overflow-hidden bg-black":
				!isMinimized && shouldShow,
			"hidden": !shouldShow,
		},
	);

	return (
		<div className={containerClassName}>
			{shouldShow && currentEvent && isMinimized && (
				<div className="flex items-center justify-between h-full px-4">
					<div className="flex items-center gap-2 flex-1 min-w-0">
						<Icons.play className="w-4 h-4 text-muted-foreground flex-shrink-0" />
						<span className="text-sm font-medium truncate">
							{currentEvent.title}
						</span>
					</div>
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={restore}
							className="p-1 hover:bg-muted rounded transition-colors"
							title="Restore player"
						>
							<Icons.chevronUp className="w-4 h-4" />
						</button>
						<button
							type="button"
							onClick={close}
							className="p-1 hover:bg-muted rounded transition-colors"
							title="Close player"
						>
							<Icons.x className="w-4 h-4" />
						</button>
					</div>
				</div>
			)}

			{shouldShow && currentEvent && !isMinimized && (
				<>
					<div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-2 bg-gradient-to-b from-black/80 to-transparent">
						<Link
							{...buildEventLink(currentEvent.id, {
								year: year ?? undefined,
							})}
							className="text-sm font-medium text-white hover:underline truncate flex-1 min-w-0 pr-2"
						>
							{currentEvent.title}
						</Link>
						<div className="flex items-center gap-1 flex-shrink-0">
							{!isLive && (
								<PlaybackSpeedControl
									currentSpeed={currentSpeed}
									onSpeedChange={handleSpeedChange}
									variant="icon"
									className="text-white hover:bg-white/20"
								/>
							)}
							{!isLive && bookmark?.id && (
								<WatchLaterButton
									bookmarkId={bookmark.id}
									isInWatchLater={bookmark.watch_later === true}
									onToggle={toggleWatchLater}
									variant="icon"
									className="h-8 w-8 text-white hover:bg-white/20 border-0"
								/>
							)}
							<button
								type="button"
								onClick={minimize}
								className="p-1.5 hover:bg-white/20 rounded transition-colors"
								title="Minimize player"
							>
								<Icons.chevronDown className="w-4 h-4 text-white" />
							</button>
							<button
								type="button"
								onClick={close}
								className="p-1.5 hover:bg-white/20 rounded transition-colors"
								title="Close player"
							>
								<Icons.x className="w-4 h-4 text-white" />
							</button>
						</div>
					</div>
				</>
			)}
			<div id="floating-video-portal" className="w-full h-full" />
		</div>
	);
}
