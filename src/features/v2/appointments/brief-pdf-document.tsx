import type { AppointmentBriefDto } from "@moodday/contracts";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#fffdf8",
    color: "#18312f",
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.5,
    paddingBottom: 42,
    paddingHorizontal: 42,
    paddingTop: 42,
  },
  eyebrow: {
    color: "#1e7775",
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: 1.4,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  title: { fontSize: 24, fontWeight: 700, lineHeight: 1.15 },
  meta: { color: "#526765", marginTop: 8 },
  notice: {
    backgroundColor: "#eef5f2",
    borderRadius: 8,
    color: "#315451",
    marginTop: 18,
    padding: 12,
  },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 14, fontWeight: 700, marginBottom: 8 },
  item: {
    borderBottomColor: "#dde4df",
    borderBottomWidth: 1,
    paddingBottom: 8,
    paddingTop: 8,
  },
  empty: { color: "#61716f", fontStyle: "italic" },
  footer: { color: "#61716f", fontSize: 8, marginTop: 28 },
});

const copy = {
  fr: {
    eyebrow: "Mood Day · Brief de consultation",
    questions: "Questions préparées",
    decisions: "Décisions et suites",
    emptyQuestions: "Aucune question incluse dans cette version.",
    emptyDecisions: "Aucune suite incluse dans cette version.",
    privateNotice: (count: number) =>
      `${count} note${count > 1 ? "s" : ""} privée${count > 1 ? "s" : ""} exclue${count > 1 ? "s" : ""}. Mood Day ne les ajoute jamais automatiquement.`,
    generated: "Généré",
    version: "Version",
    disclaimer:
      "Document préparé par la personne utilisatrice. Mood Day ne formule ni diagnostic ni recommandation thérapeutique.",
  },
  en: {
    eyebrow: "Mood Day · Appointment brief",
    questions: "Prepared questions",
    decisions: "Decisions and follow-ups",
    emptyQuestions: "No question is included in this version.",
    emptyDecisions: "No follow-up is included in this version.",
    privateNotice: (count: number) =>
      `${count} private note${count === 1 ? "" : "s"} excluded. Mood Day never adds them automatically.`,
    generated: "Generated",
    version: "Version",
    disclaimer:
      "Prepared by the user. Mood Day does not provide diagnoses or treatment recommendations.",
  },
} as const;

const formatDate = (value: string, locale: "fr" | "en", timezone: string) =>
  new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-GB", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: timezone,
  }).format(new Date(value));

export function AppointmentBriefPdfDocument({
  brief,
  locale,
}: {
  brief: AppointmentBriefDto;
  locale: "fr" | "en";
}) {
  const text = copy[locale];
  const { appointment, decisions, excludedPrivateQuestionCount, questions } =
    brief.content;
  return (
    <Document
      author="Mood Day"
      subject={text.eyebrow}
      title={appointment.title}
    >
      <Page size="A4" style={styles.page}>
        <Text style={styles.eyebrow}>{text.eyebrow}</Text>
        <Text style={styles.title}>{appointment.title}</Text>
        <Text style={styles.meta}>
          {formatDate(appointment.startsAt, locale, appointment.timezone)}
          {appointment.clinician ? ` · ${appointment.clinician}` : ""}
        </Text>
        <Text style={styles.meta}>
          {text.version} {brief.version} · {text.generated}{" "}
          {formatDate(brief.content.generatedAt, locale, appointment.timezone)}
        </Text>

        <Text style={styles.notice}>
          {text.privateNotice(excludedPrivateQuestionCount)}
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{text.questions}</Text>
          {questions.length > 0 ? (
            questions.map((question, index) => (
              <Text key={`${question.content}-${index}`} style={styles.item}>
                {index + 1}. {question.content}
              </Text>
            ))
          ) : (
            <Text style={styles.empty}>{text.emptyQuestions}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{text.decisions}</Text>
          {decisions.length > 0 ? (
            decisions.map((decision, index) => (
              <Text key={`${decision.summary}-${index}`} style={styles.item}>
                {decision.summary}
              </Text>
            ))
          ) : (
            <Text style={styles.empty}>{text.emptyDecisions}</Text>
          )}
        </View>

        <Text style={styles.footer}>{text.disclaimer}</Text>
      </Page>
    </Document>
  );
}
