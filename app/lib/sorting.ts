import type { Event, RoomData, Track } from "~/types/fosdem";

export function sortEvents(a: Event, b: Event): number {
  const aPriority = a.priority || 3;
  const bPriority = b.priority || 3;
  if (aPriority !== bPriority) {
    return aPriority - bPriority;
  }

  const dayDiff = Number(a.day) - Number(b.day);
  if (dayDiff !== 0) {
    return dayDiff;
  }

  if (a.startTime !== b.startTime) {
    return a.startTime.localeCompare(b.startTime);
  }

  if (a.duration !== b.duration) {
    return a.duration.localeCompare(b.duration);
  }

  return a.title.localeCompare(b.title);
}

export function sortTracks(a: Track, b: Track): number {
  return a.name.localeCompare(b.name);
}

export function sortEventsWithFavorites(favorites: Record<string, boolean>) {
  return (a: Event, b: Event): number => {
    const aFav = favorites[a.id] || false;
    const bFav = favorites[b.id] || false;
    if (aFav !== bFav) {
      return bFav ? 1 : -1;
    }

    return sortEvents(a, b);
  };
}

export function sortTracksWithFavorites(favorites: Record<string, boolean>) {
  return (a: Track, b: Track): number => {
    const aFav = favorites[a.id] || false;
    const bFav = favorites[b.id] || false;
    if (aFav !== bFav) {
      return bFav ? 1 : -1;
    }

    return a.name.localeCompare(b.name);
  };
}

export function sortRooms(a: RoomData, b: RoomData): number {
  const aOnline = a.name.toLowerCase().includes('online');
  const bOnline = b.name.toLowerCase().includes('online');
  if (aOnline !== bOnline) return aOnline ? 1 : -1;

  const buildingA = a.buildingId || a.building?.id || "";
  const buildingB = b.buildingId || b.building?.id || "";
  const buildingCompare = buildingA.localeCompare(buildingB);
  if (buildingCompare !== 0) return buildingCompare;

  return a.name.localeCompare(b.name);
}

export function sortUpcomingEvents(a: Event, b: Event): number {
  if (a.startTime !== b.startTime) {
    return a.startTime.localeCompare(b.startTime);
  }

  if (a.duration !== b.duration) {
    return a.duration.localeCompare(b.duration);
  }

  return a.title.localeCompare(b.title);
}

export function sortScheduleEvents(a: Event, b: Event): number {
  const dayDiff = Number(a.day) - Number(b.day);
  if (dayDiff !== 0) {
    return dayDiff;
  }

  // Convert times to minutes for accurate comparison
  const [aHours, aMinutes] = a.startTime.split(':').map(Number);
  const [bHours, bMinutes] = b.startTime.split(':').map(Number);
  const aTime = aHours * 60 + aMinutes;
  const bTime = bHours * 60 + bMinutes;

  if (aTime !== bTime) {
    return aTime - bTime;
  }

  return a.title.localeCompare(b.title);
} 