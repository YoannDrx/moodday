import type { ConsultationExportData } from "./export-types";

const escapeCsvCell = (value: string | number | null | undefined) => {
  const normalized = value === null || value === undefined ? "" : String(value);
  return /[",\r\n]/.test(normalized)
    ? `"${normalized.replaceAll('"', '""')}"`
    : normalized;
};

const formatLocalDateTime = (value: string, timezone: string) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
};

export const buildConsultationCsv = (data: ConsultationExportData) => {
  const timezone = data.metadata.timezone;
  const rows: (string | number | null | undefined)[][] = [
    [
      "record_type",
      "occurred_at_utc",
      "occurred_at_local",
      "name",
      "primary_value",
      "secondary_value",
      "status",
      "notes",
      "timezone",
      "source",
    ],
  ];

  data.mood.entries.forEach((entry) => {
    rows.push([
      "mood",
      entry.date,
      formatLocalDateTime(entry.date, timezone),
      "daily_check_in",
      entry.value,
      entry.energy,
      "recorded",
      entry.note,
      timezone,
      data.metadata.source,
    ]);
  });

  data.medications.list.forEach((medication) => {
    medication.intakes.forEach((intake) => {
      rows.push([
        "medication_intake",
        intake.date,
        formatLocalDateTime(intake.date, timezone),
        medication.name,
        medication.dosage,
        medication.frequency,
        intake.skipped ? "skipped" : "taken",
        intake.note,
        timezone,
        data.metadata.source,
      ]);
    });
  });

  data.therapy.sessions.forEach((session) => {
    rows.push([
      "therapy_session",
      session.date,
      formatLocalDateTime(session.date, timezone),
      "therapy",
      session.benefitRating,
      null,
      "recorded",
      session.notes,
      timezone,
      data.metadata.source,
    ]);
  });

  data.exercises.logs.forEach((log) => {
    rows.push([
      "exercise",
      log.date,
      formatLocalDateTime(log.date, timezone),
      log.name,
      null,
      null,
      "completed",
      log.note,
      timezone,
      data.metadata.source,
    ]);
  });

  return `\uFEFF${rows
    .map((row) => row.map((cell) => escapeCsvCell(cell)).join(","))
    .join("\r\n")}\r\n`;
};
