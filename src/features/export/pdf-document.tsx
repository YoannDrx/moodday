import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { ConsultationExportData } from "./export-types";

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: "#6b7280",
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#1f2937",
    backgroundColor: "#f3f4f6",
    padding: 5,
  },
  preparationItem: {
    marginBottom: 5,
    paddingLeft: 8,
  },
  row: {
    flexDirection: "row",
    marginBottom: 3,
  },
  label: {
    width: 120,
    color: "#6b7280",
  },
  value: {
    flex: 1,
    color: "#1f2937",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    backgroundColor: "#f9fafb",
    padding: 8,
  },
  statBox: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#3b82f6",
  },
  statLabel: {
    fontSize: 8,
    color: "#6b7280",
  },
  moodEntry: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    paddingVertical: 3,
  },
  moodDate: {
    width: 80,
    color: "#6b7280",
  },
  moodValue: {
    width: 40,
    textAlign: "center",
    fontWeight: "bold",
  },
  moodNote: {
    flex: 1,
    color: "#6b7280",
    fontSize: 9,
  },
  medItem: {
    marginBottom: 8,
    padding: 5,
    backgroundColor: "#f9fafb",
  },
  medName: {
    fontWeight: "bold",
    marginBottom: 2,
  },
  medDetail: {
    color: "#6b7280",
    fontSize: 9,
  },
  therapyItem: {
    marginBottom: 8,
    padding: 5,
    borderLeftWidth: 2,
    borderLeftColor: "#10b981",
  },
  therapyDate: {
    fontWeight: "bold",
    marginBottom: 2,
  },
  therapyNotes: {
    fontSize: 9,
    color: "#4b5563",
    lineHeight: 1.4,
  },
  exerciseList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  exerciseItem: {
    backgroundColor: "#fef3c7",
    padding: 3,
    paddingHorizontal: 6,
    fontSize: 9,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#9ca3af",
  },
});

type PDFDocumentProps = {
  data: ConsultationExportData;
  locale: "fr" | "en";
  translate: (key: string, values?: Record<string, string | number>) => string;
};

const formatDate = (dateStr: string, locale: string, timeZone: string) => {
  return new Date(dateStr).toLocaleDateString(locale, {
    timeZone,
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatDateKey = (dateKey: string, locale: string) =>
  formatDate(`${dateKey}T12:00:00.000Z`, locale, "UTC");

const frequencyLabelKeys: Record<string, string> = {
  daily: "medication.frequency.daily",
  twice_daily: "medication.frequency.twiceDaily",
  weekly: "medication.frequency.weekly",
  prn: "medication.frequency.prn",
};

export function ExportPDFDocument({
  data,
  locale,
  translate: t,
}: PDFDocumentProps) {
  const dateLocale = locale === "fr" ? "fr-FR" : "en-US";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {t("export.pdf.title", { name: data.userName })}
          </Text>
          <Text style={styles.subtitle}>
            {t("export.pdf.period", {
              start: formatDateKey(data.period.startDate, dateLocale),
              end: formatDateKey(data.period.endDate, dateLocale),
            })}
          </Text>
          <Text style={styles.subtitle}>
            {t("export.pdf.timezone", { timezone: data.metadata.timezone })}
          </Text>
        </View>

        {data.preparation ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {locale === "fr"
                ? "Ma préparation"
                : "My consultation preparation"}
            </Text>
            <Text style={styles.preparationItem}>
              {data.preparation.title}
            </Text>
            {data.preparation.scheduledFor ? (
              <Text style={styles.preparationItem}>
                {locale === "fr" ? "Date prévue" : "Planned date"}: {" "}
                {formatDate(
                  data.preparation.scheduledFor,
                  dateLocale,
                  data.metadata.timezone,
                )}
              </Text>
            ) : null}
            {data.preparation.questions.length > 0 ? (
              <View style={styles.preparationItem}>
                <Text>
                  {locale === "fr" ? "Mes questions" : "My questions"}:
                </Text>
                {data.preparation.questions.map((question, index) => (
                  <Text key={`${index}:${question}`}>• {question}</Text>
                ))}
              </View>
            ) : null}
            {data.preparation.importantEvents.length > 0 ? (
              <View style={styles.preparationItem}>
                <Text>
                  {locale === "fr"
                    ? "Événements importants"
                    : "Important events"}
                  :
                </Text>
                {data.preparation.importantEvents.map((event, index) => (
                  <Text key={`${index}:${event}`}>• {event}</Text>
                ))}
              </View>
            ) : null}
            {data.preparation.personalNotes ? (
              <View style={styles.preparationItem}>
                <Text>
                  {locale === "fr" ? "Notes personnelles" : "Personal notes"}:
                </Text>
                <Text>{data.preparation.personalNotes}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Mood Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("export.pdf.sections.mood")}
          </Text>
          {data.mood.stats.count > 0 ? (
            <>
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>
                    {data.mood.stats.average}/10
                  </Text>
                  <Text style={styles.statLabel}>
                    {t("export.pdf.stats.average")}
                  </Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{data.mood.stats.min}</Text>
                  <Text style={styles.statLabel}>
                    {t("export.pdf.stats.min")}
                  </Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{data.mood.stats.max}</Text>
                  <Text style={styles.statLabel}>
                    {t("export.pdf.stats.max")}
                  </Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{data.mood.stats.count}</Text>
                  <Text style={styles.statLabel}>
                    {t("export.pdf.stats.entries")}
                  </Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>
                    {data.mood.stats.change === null
                      ? "—"
                      : `${data.mood.stats.change > 0 ? "+" : ""}${data.mood.stats.change}`}
                  </Text>
                  <Text style={styles.statLabel}>
                    {locale === "fr" ? "Évolution" : "Change"}
                  </Text>
                </View>
              </View>
              {data.mood.entries.slice(0, 15).map((entry, i) => (
                <View key={i} style={styles.moodEntry}>
                  <Text style={styles.moodDate}>
                    {formatDate(entry.date, dateLocale, data.metadata.timezone)}
                  </Text>
                  <Text style={styles.moodValue}>{entry.value}/10</Text>
                  <Text style={styles.moodNote}>
                    {[
                      entry.energy === null
                        ? null
                        : `${locale === "fr" ? "énergie" : "energy"} ${entry.energy}/10`,
                      entry.anxiety === null
                        ? null
                        : `${locale === "fr" ? "anxiété" : "anxiety"} ${entry.anxiety}/10`,
                      entry.sleepHours === null
                        ? null
                        : `${locale === "fr" ? "sommeil" : "sleep"} ${entry.sleepHours} h`,
                      entry.note ? entry.note.slice(0, 50) : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </Text>
                </View>
              ))}
              {data.mood.entries.length > 15 && (
                <Text style={{ color: "#9ca3af", fontSize: 8, marginTop: 3 }}>
                  {t("export.pdf.moreEntries", {
                    count: data.mood.entries.length - 15,
                  })}
                </Text>
              )}
            </>
          ) : (
            <Text style={{ color: "#9ca3af" }}>
              {t("export.pdf.noMoodEntries")}
            </Text>
          )}
        </View>

        {/* Medications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("export.pdf.sections.medications")}
          </Text>
          {data.medications.adherencePercent !== null && (
            <View style={styles.row}>
              <Text style={styles.label}>{t("export.pdf.adherence")}:</Text>
              <Text style={styles.value}>
                {data.medications.adherencePercent}% ({data.medications.takenDoses}
                /{data.medications.expectedDoses}{" "}
                {locale === "fr" ? "prises prévues" : "scheduled doses"}; PRN{ " "}
                {locale === "fr" ? "exclues" : "excluded"})
              </Text>
            </View>
          )}
          {data.medications.list.length > 0 ? (
            data.medications.list.map((med, i) => (
              <View key={i} style={styles.medItem}>
                <Text style={styles.medName}>
                  {med.name} - {med.dosage}
                </Text>
                <Text style={styles.medDetail}>
                  {frequencyLabelKeys[med.frequency]
                    ? t(frequencyLabelKeys[med.frequency])
                    : med.frequency}
                  {med.isPRN ? ` ${t("medication.prn.also")}` : ""} •{" "}
                  {med.intakesCount}{" "}
                  {med.intakesCount === 1
                    ? t("export.pdf.intakeSingular")
                    : t("export.pdf.intakePlural")}
                </Text>
                {med.dosageChanges.length > 0 && (
                  <Text style={styles.medDetail}>
                    {t("export.pdf.dosageChanges")}:{" "}
                    {med.dosageChanges
                      .map(
                        (c) =>
                          `${formatDate(c.date, dateLocale, data.metadata.timezone)}: ${c.from ?? "?"} → ${c.to}`,
                      )
                      .join(", ")}
                  </Text>
                )}
              </View>
            ))
          ) : (
            <Text style={{ color: "#9ca3af" }}>
              {t("export.pdf.noMedications")}
            </Text>
          )}
        </View>

        {/* Therapy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("export.pdf.sections.therapy", { count: data.therapy.count })}
          </Text>
          {data.therapy.sessions.length > 0 ? (
            data.therapy.sessions.slice(0, 5).map((session, i) => (
              <View key={i} style={styles.therapyItem}>
                <Text style={styles.therapyDate}>
                  {formatDate(session.date, dateLocale, data.metadata.timezone)}
                  {session.benefitRating
                    ? ` - ${t("export.pdf.benefitRating", {
                        value: session.benefitRating,
                      })}`
                    : ""}
                </Text>
                <Text style={styles.therapyNotes}>
                  {session.notes.slice(0, 200)}
                  {session.notes.length > 200 ? "..." : ""}
                </Text>
              </View>
            ))
          ) : (
            <Text style={{ color: "#9ca3af" }}>
              {t("export.pdf.noTherapy")}
            </Text>
          )}
        </View>

        {/* Exercises */}
        {data.exercises.count > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t("export.pdf.sections.exercises", {
                count: data.exercises.count,
              })}
            </Text>
            <View style={styles.exerciseList}>
              {data.exercises.logs.slice(0, 20).map((log, i) => (
                <Text key={i} style={styles.exerciseItem}>
                  {log.name} (
                  {formatDate(log.date, dateLocale, data.metadata.timezone)})
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          {t("export.pdf.footer", {
            date: formatDate(
              data.metadata.generatedAt,
              dateLocale,
              data.metadata.timezone,
            ),
          })}
        </Text>
      </Page>
    </Document>
  );
}
