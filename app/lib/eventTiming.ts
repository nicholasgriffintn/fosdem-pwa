import type { ConferenceData, Event } from "~/types/fosdem";

const BUFFER_MINUTES = 15;

export const getEventTiming = (event: Event, conference: ConferenceData) => {
  try {
    const conferenceStartDate = new Date(conference.start);
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

export const isEventLive = (event: Event, conference: ConferenceData) => {
  const timing = getEventTiming(event, conference);
  if (!timing) return false;

  const now = new Date();
  const bufferStart = new Date(timing.start);
  const bufferEnd = new Date(timing.end);

  bufferStart.setMinutes(bufferStart.getMinutes() - BUFFER_MINUTES);
  bufferEnd.setMinutes(bufferEnd.getMinutes() + BUFFER_MINUTES);

  return now >= bufferStart && now <= bufferEnd;
};