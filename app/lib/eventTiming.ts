import type { Event, ConferenceData } from "~/types/fosdem";

export function parseEventTime(timeStr: string) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export function parseEventDuration(durationStr: string) {
  const [hours, minutes] = durationStr.split(":").map(Number);
  return (hours * 60 + minutes) * 60 * 1000;
}

export function getEventEndTime(event: Event) {
  const startTime = parseEventTime(event.startTime);
  const duration = parseEventDuration(event.duration);
  return new Date(startTime.getTime() + duration);
}

export function getEventDateTime(event: Event, conference: ConferenceData): Date | null {
  if (!conference?.days || !Array.isArray(conference.days) || conference.days.length === 0 || !event.day) {
    return null;
  }

  const dayIndex = Number(event.day) - 1;
  if (dayIndex < 0 || dayIndex >= conference.days.length) {
    return null;
  }

  if (!conference.days[dayIndex]) {
    return null;
  }

  const eventDate = new Date(conference.days[dayIndex]);
  const [hours, minutes] = event.startTime.split(":").map(Number);
  eventDate.setHours(hours, minutes, 0, 0);
  return eventDate;
}

export function isEventLive(event: Event, conference: ConferenceData): boolean {
  try {
    const now = new Date();
    const eventStart = getEventDateTime(event, conference);
    if (!eventStart) return false;

    const duration = parseEventDuration(event.duration);
    const eventEnd = new Date(eventStart.getTime() + duration);

    return now >= eventStart && now <= eventEnd;
  } catch (error) {
    console.error('Error checking if event is live:', error);
    return false;
  }
}

export function isEventUpcoming(event: Event, conference: ConferenceData, withinMinutes = 30): boolean {
  try {
    const now = new Date();
    const eventStart = getEventDateTime(event, conference);
    if (!eventStart) return false;

    const timeUntilStart = eventStart.getTime() - now.getTime();
    return timeUntilStart > 0 && timeUntilStart <= withinMinutes * 60 * 1000;
  } catch (error) {
    console.error('Error checking if event is upcoming:', error);
    return false;
  }
}

export function isEventFinished(event: Event, conference: ConferenceData): boolean {
  try {
    const now = new Date();
    const eventStart = getEventDateTime(event, conference);
    if (!eventStart) return false;

    const duration = parseEventDuration(event.duration);
    const eventEnd = new Date(eventStart.getTime() + duration);

    return now > eventEnd;
  } catch (error) {
    console.error('Error checking if event is finished:', error);
    return false;
  }
}

export function getEventStatus(event: Event, conference: ConferenceData): 'live' | 'upcoming' | 'finished' | 'scheduled' {
  if (isEventLive(event, conference)) return 'live';
  if (isEventUpcoming(event, conference)) return 'upcoming';
  if (isEventFinished(event, conference)) return 'finished';
  return 'scheduled';
}