"use client";

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

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

type ExportData = {
  period: { start: string; end: string };
  userName: string;
  mood: {
    entries: { value: number; note: string | null; date: string }[];
    stats: {
      average: number | null;
      min: number | null;
      max: number | null;
      count: number;
    };
  };
  medications: {
    list: {
      name: string;
      dosage: string;
      frequency: string;
      isPRN: boolean;
      intakesCount: number;
      dosageChanges: {
        date: string;
        from: string | null;
        to: string;
      }[];
    }[];
    adherencePercent: number | null;
  };
  therapy: {
    sessions: {
      date: string;
      notes: string;
      benefitRating: number | null;
    }[];
    count: number;
  };
  exercises: {
    logs: { name: string; date: string }[];
    count: number;
  };
};

type PDFDocumentProps = {
  data: ExportData;
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const frequencyLabels: Record<string, string> = {
  daily: "Quotidien",
  twice_daily: "2x/jour",
  weekly: "Hebdomadaire",
  prn: "Si besoin",
};

export function ExportPDFDocument({ data }: PDFDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Rapport de suivi - {data.userName}</Text>
          <Text style={styles.subtitle}>
            Période: {formatDate(data.period.start)} -{" "}
            {formatDate(data.period.end)}
          </Text>
        </View>

        {/* Mood Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Humeur</Text>
          {data.mood.stats.count > 0 ? (
            <>
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>
                    {data.mood.stats.average}/10
                  </Text>
                  <Text style={styles.statLabel}>Moyenne</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{data.mood.stats.min}</Text>
                  <Text style={styles.statLabel}>Min</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{data.mood.stats.max}</Text>
                  <Text style={styles.statLabel}>Max</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{data.mood.stats.count}</Text>
                  <Text style={styles.statLabel}>Entrées</Text>
                </View>
              </View>
              {data.mood.entries.slice(0, 15).map((entry, i) => (
                <View key={i} style={styles.moodEntry}>
                  <Text style={styles.moodDate}>{formatDate(entry.date)}</Text>
                  <Text style={styles.moodValue}>{entry.value}/10</Text>
                  <Text style={styles.moodNote}>
                    {entry.note ? entry.note.slice(0, 50) : ""}
                  </Text>
                </View>
              ))}
              {data.mood.entries.length > 15 && (
                <Text style={{ color: "#9ca3af", fontSize: 8, marginTop: 3 }}>
                  +{data.mood.entries.length - 15} entrées supplémentaires
                </Text>
              )}
            </>
          ) : (
            <Text style={{ color: "#9ca3af" }}>Aucune entrée d'humeur</Text>
          )}
        </View>

        {/* Medications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Médicaments</Text>
          {data.medications.adherencePercent !== null && (
            <View style={styles.row}>
              <Text style={styles.label}>Observance:</Text>
              <Text style={styles.value}>
                {data.medications.adherencePercent}%
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
                  {frequencyLabels[med.frequency] || med.frequency}
                  {med.isPRN ? " (aussi PRN)" : ""} • {med.intakesCount} prises
                </Text>
                {med.dosageChanges.length > 0 && (
                  <Text style={styles.medDetail}>
                    Changements:{" "}
                    {med.dosageChanges
                      .map(
                        (c) =>
                          `${formatDate(c.date)}: ${c.from ?? "?"} → ${c.to}`,
                      )
                      .join(", ")}
                  </Text>
                )}
              </View>
            ))
          ) : (
            <Text style={{ color: "#9ca3af" }}>Aucun médicament</Text>
          )}
        </View>

        {/* Therapy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Thérapie ({data.therapy.count} séances)
          </Text>
          {data.therapy.sessions.length > 0 ? (
            data.therapy.sessions.slice(0, 5).map((session, i) => (
              <View key={i} style={styles.therapyItem}>
                <Text style={styles.therapyDate}>
                  {formatDate(session.date)}
                  {session.benefitRating
                    ? ` - ${session.benefitRating}/5 étoiles`
                    : ""}
                </Text>
                <Text style={styles.therapyNotes}>
                  {session.notes.slice(0, 200)}
                  {session.notes.length > 200 ? "..." : ""}
                </Text>
              </View>
            ))
          ) : (
            <Text style={{ color: "#9ca3af" }}>Aucune séance</Text>
          )}
        </View>

        {/* Exercises */}
        {data.exercises.count > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Exercices ({data.exercises.count} complétés)
            </Text>
            <View style={styles.exerciseList}>
              {data.exercises.logs.slice(0, 20).map((log, i) => (
                <Text key={i} style={styles.exerciseItem}>
                  {log.name} ({formatDate(log.date)})
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Généré par Moodday • {new Date().toLocaleDateString("fr-FR")}
        </Text>
      </Page>
    </Document>
  );
}
