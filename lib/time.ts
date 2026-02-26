const DATE_INPUT_PARTS = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
} as const;

function getPart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
  return parts.find((part) => part.type === type)?.value ?? "00";
}

export function toDateTimeLocalInTimeZone(
  value: Date,
  timeZone = "Europe/Istanbul",
): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    ...DATE_INPUT_PARTS,
    timeZone,
  }).formatToParts(value);

  const year = getPart(parts, "year");
  const month = getPart(parts, "month");
  const day = getPart(parts, "day");
  const hour = getPart(parts, "hour");
  const minute = getPart(parts, "minute");

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

export function normalizeDateTimeInput(value: string): string {
  if (!value) {
    return value;
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    return `${value}:00`;
  }

  return value;
}

export function formatIstanbulDateTime(isoDate: string): string {
  const date = new Date(isoDate);

  if (Number.isNaN(date.valueOf())) {
    return isoDate;
  }

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "Europe/Istanbul",
  }).format(date);
}
