export function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[\r\n\",]/.test(str)) {
    return `"${str.replaceAll('"', '""')}"`;
  }
  return str;
}

export type ImportRow = {
  type?: "event" | "track";
  id: string;
  priority?: number | null;
};

export function parseBookmarkImportCsv(csv: string): ImportRow[] {
  const raw = csv.replaceAll("\r\n", "\n").replaceAll("\r", "\n");
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const rows: ImportRow[] = [];
  let headerIndex: Record<string, number> | null = null;

  for (const line of lines) {
    const rawParts = line.split(",").map((p) => p.trim());
    const parts = rawParts.filter(Boolean);
    if (parts.length === 0) continue;

    if (!headerIndex && /\btype\b/i.test(line) && /\bid\b/i.test(line)) {
      headerIndex = {};
      for (const [idx, col] of rawParts.entries()) {
        const normalized = col.toLowerCase();
        if (!normalized) continue;
        headerIndex[normalized] = idx;
      }
      continue;
    }

    if (parts.length === 1) {
      rows.push({ id: parts[0] });
      continue;
    }

    const getCol = (name: string) => {
      if (!headerIndex) return undefined;
      const idx = headerIndex[name];
      if (typeof idx !== "number") return undefined;
      return rawParts[idx];
    };

    const type = (getCol("type") ?? parts[0]).toLowerCase();
    const id = getCol("id") ?? parts[1];
    const priorityRaw = getCol("priority") ?? rawParts[2];
    const priorityNum = priorityRaw ? Number(priorityRaw) : null;
    const priority = Number.isFinite(priorityNum) ? priorityNum : null;

    if (!id) continue;

    if (type === "event" || type === "track") {
      rows.push({ type, id, priority });
    } else {
      rows.push({ id, priority });
    }
  }

  return rows;
}

export const CSV_HEADER = [
  "type",
  "id",
  "slug",
  "title",
  "trackKey",
  "room",
  "day",
  "startTime",
  "duration",
  "priority",
  "status",
] as const;

export function buildCsvHeader(): string {
  return CSV_HEADER.join(",");
}
