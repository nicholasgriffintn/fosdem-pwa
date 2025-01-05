export function formatTime(seconds?: number) {
  if (!seconds) return null;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function formatDate(date: Date) {
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function get24HrFormat(str: string) {
  const _t = str.split(/[^0-9]/g);
  _t[0] = String(+_t[0] + (str.indexOf("pm") > -1 && +_t[0] !== 12 ? 12 : 0));
  return _t.join("");
}

export function calculateEndTime(startTime: string, duration: string) {
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [durationHours, durationMinutes] = duration.split(':').map(Number);

  const startDate = new Date(2024, 0, 1);
  startDate.setHours(startHours, startMinutes, 0);

  const totalMinutes = (durationHours * 60) + durationMinutes;
  const endDate = new Date(startDate.getTime() + totalMinutes * 60000);

  return endDate.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};