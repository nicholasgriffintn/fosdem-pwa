"use client";

import { useCallback, useEffect, useRef } from "react";

import { usePlayer } from "~/contexts/PlayerContext";
import { useBookmark } from "~/hooks/use-bookmark";
import { useWatchLater } from "~/hooks/use-watch-later";

const SAVE_INTERVAL_MS = 30000;

export function VideoProgressTracker() {
  const { videoRef, currentEvent, year, isPlaying, isLive } = usePlayer();
  const lastSavedTimeRef = useRef<number>(0);
  const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const bookmarkIdRef = useRef<string | null>(null);

  const eventSlug = currentEvent?.id ?? "";
  const yearNum = year ?? new Date().getFullYear();

  const { bookmark } = useBookmark({ year: yearNum, slug: eventSlug });
  const { updateProgress, markAsWatched } = useWatchLater({ year: yearNum });

  bookmarkIdRef.current = bookmark?.serverId ?? null;

  const updateProgressRef = useRef(updateProgress);
  const markWatchedRef = useRef(markAsWatched);
  updateProgressRef.current = updateProgress;
  markWatchedRef.current = markAsWatched;

  const saveProgress = useCallback(() => {
    const video = videoRef.current;
    const bookmarkId = bookmarkIdRef.current;
    if (!video || !bookmarkId || isLive) return;

    const currentTime = Math.floor(video.currentTime);
    if (currentTime === lastSavedTimeRef.current) return;
    if (currentTime < 5) return;

    lastSavedTimeRef.current = currentTime;
    const playbackSpeed = video.playbackRate.toString();

    updateProgressRef.current({
      bookmarkId,
      progressSeconds: currentTime,
      playbackSpeed,
    });
  }, [isLive, videoRef]);

  const handleVideoEnded = useCallback(() => {
    const bookmarkId = bookmarkIdRef.current;
    if (!bookmarkId || isLive) return;
    markWatchedRef.current(bookmarkId);
  }, [isLive]);

  useEffect(() => {
    if (!bookmark?.serverId || isLive || !isPlaying) {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
        saveIntervalRef.current = null;
      }
      return;
    }

    if (saveIntervalRef.current) {
      clearInterval(saveIntervalRef.current);
    }

    saveIntervalRef.current = setInterval(() => {
      saveProgress();
    }, SAVE_INTERVAL_MS);

    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
        saveIntervalRef.current = null;
      }
    };
  }, [bookmark?.serverId, isLive, isPlaying, saveProgress]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || isLive) return;

    video.addEventListener("ended", handleVideoEnded);
    return () => {
      video.removeEventListener("ended", handleVideoEnded);
    };
  }, [isLive, handleVideoEnded, videoRef]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || isLive) return;

    const handlePause = () => {
      saveProgress();
    };

    video.addEventListener("pause", handlePause);
    return () => {
      video.removeEventListener("pause", handlePause);
    };
  }, [isLive, saveProgress, videoRef]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || isLive || !bookmark?.watch_progress_seconds) return;

    const savedProgress = bookmark.watch_progress_seconds;

    const handleLoadedMetadata = () => {
      if (savedProgress > 0 && savedProgress < video.duration - 10) {
        video.currentTime = savedProgress;
        lastSavedTimeRef.current = savedProgress;
      }
    };

    if (video.readyState >= 1) {
      handleLoadedMetadata();
    } else {
      video.addEventListener("loadedmetadata", handleLoadedMetadata);
      return () => {
        video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      };
    }
  }, [isLive, bookmark?.watch_progress_seconds, videoRef]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || isLive || !bookmark?.playback_speed) {
      return;
    }

    const speed = parseFloat(bookmark.playback_speed);
    if (!isNaN(speed) && speed > 0) {
      video.playbackRate = speed;
    }
  }, [isLive, bookmark?.playback_speed, videoRef]);

  useEffect(() => {
    return () => {
      saveProgress();
    };
  }, [currentEvent?.id, saveProgress]);

  return null;
}
