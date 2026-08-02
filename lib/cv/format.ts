const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** "2022-03" -> "Mar 2022". Passes through anything it doesn't recognise. */
export function formatMonth(value: string): string {
  const raw = value.trim();
  if (!raw) return "";
  const match = /^(\d{4})-(\d{1,2})$/.exec(raw);
  if (!match) return raw;
  const month = Number(match[2]);
  if (month < 1 || month > 12) return raw;
  return `${MONTHS[month - 1]} ${match[1]}`;
}

/** Builds "Mar 2022 – Present", collapsing empty halves cleanly. */
export function formatRange(
  start: string,
  end: string,
  current: boolean
): string {
  const from = formatMonth(start);
  const to = current ? "Present" : formatMonth(end);
  if (from && to) return `${from} \u2013 ${to}`;
  return from || to;
}

/** "2 yrs 4 mos" from a month count, for duration labels. */
export function formatDuration(months: number): string {
  if (months <= 0) return "";
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts: string[] = [];
  if (years) parts.push(`${years} yr${years > 1 ? "s" : ""}`);
  if (rest) parts.push(`${rest} mo${rest > 1 ? "s" : ""}`);
  return parts.join(" ");
}

/** Strips protocol and trailing slash so links stay short in print. */
export function cleanUrl(url: string): string {
  return url
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/$/, "");
}

export function joinNonEmpty(parts: (string | undefined)[], sep = " \u00b7 "): string {
  return parts.map((p) => p?.trim()).filter(Boolean).join(sep);
}

/** Filename-safe slug for downloads: "Ada Lovelace" -> "Ada_Lovelace". */
export function fileSlug(value: string, fallback = "CV"): string {
  const cleaned = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\-_ ]/g, "")
    .trim()
    .replace(/\s+/g, "_");
  return cleaned || fallback;
}
