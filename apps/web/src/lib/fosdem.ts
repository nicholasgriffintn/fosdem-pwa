import type { Event } from "~/types/fosdem";

interface TimeSlot {
  time: string;
  events: Event[];
}

export interface EventConflict {
  event1: Event;
  event2: Event;
  overlapDuration: number;
  startOverlap: Date;
  endOverlap: Date;
}

export interface GroupedConflict {
  mainEvent: Event;
  conflicts: {
    event: Event;
    duration: number;
    startOverlap: Date;
    endOverlap: Date;
  }[];
}

interface EventWithTime {
  event: Event;
  day: string | number | string[] | number[];
  start: number;
  end: number;
}

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function parseDurationToMinutes(duration: string): number {
  const [hours, minutes] = duration.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToDate(year: number, minutes: number): Date {
  const date = new Date(year, 0, 1);
  date.setHours(Math.floor(minutes / 60), minutes % 60);
  return date;
}

export function detectEventConflicts(events: Event[], year: number): EventConflict[] {
  if (events.length < 2) {
    return [];
  }

  const eventsWithTime: EventWithTime[] = events.map((event) => ({
    event,
    day: event.day,
    start: parseTimeToMinutes(event.startTime),
    end: parseTimeToMinutes(event.startTime) + parseDurationToMinutes(event.duration),
  }));

  const byDay = new Map<string | number | string[] | number[], EventWithTime[]>();
  for (const e of eventsWithTime) {
    const dayKey = String(e.day);
    const dayEvents = byDay.get(dayKey);
    if (dayEvents) {
      dayEvents.push(e);
    } else {
      byDay.set(dayKey, [e]);
    }
  }

  const conflicts: EventConflict[] = [];

  for (const dayEvents of byDay.values()) {
    if (dayEvents.length < 2) continue;

    dayEvents.sort((a, b) => a.start - b.start);

    for (let i = 0; i < dayEvents.length; i++) {
      const current = dayEvents[i];
      for (let j = i + 1; j < dayEvents.length && dayEvents[j].start < current.end; j++) {
        const other = dayEvents[j];
        const overlapStart = Math.max(current.start, other.start);
        const overlapEnd = Math.min(current.end, other.end);

        conflicts.push({
          event1: current.event,
          event2: other.event,
          overlapDuration: overlapEnd - overlapStart,
          startOverlap: minutesToDate(year, overlapStart),
          endOverlap: minutesToDate(year, overlapEnd),
        });
      }
    }
  }

  return conflicts;
}

export function generateTimeSlots(events: Event[]): TimeSlot[] {
  const timeSlots: { [key: string]: Event[] } = {};
  const sortedTimes: string[] = [];

  for (const event of events) {
    if (!timeSlots[event.startTime]) {
      timeSlots[event.startTime] = [];
      sortedTimes.push(event.startTime);
    }
    timeSlots[event.startTime].push(event);
  }

  sortedTimes.sort((a, b) => {
    const [aHours, aMinutes] = a.split(":").map(Number);
    const [bHours, bMinutes] = b.split(":").map(Number);
    return aHours * 60 + aMinutes - (bHours * 60 + bMinutes);
  });

  return sortedTimes.map((time) => ({
    time,
    events: timeSlots[time],
  }));
}
