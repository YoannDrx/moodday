export type ConsultationExportData = {
  metadata: {
    generatedAt: string;
    timezone: string;
    source: "Moodday";
    formatVersion: "2.0";
  };
  period: {
    startDate: string;
    endDate: string;
    start: string;
    endExclusive: string;
  };
  userName: string;
  preparation?: {
    id: string;
    title: string;
    scheduledFor: string | null;
    questions: string[];
    importantEvents: string[];
    personalNotes: string | null;
    status: "draft" | "completed" | "archived";
  } | null;
  mood: {
    entries: {
      value: number;
      energy: number | null;
      anxiety: number | null;
      sleepHours: number | null;
      sleepQuality: string | null;
      note: string | null;
      date: string;
    }[];
    stats: {
      average: number | null;
      min: number | null;
      max: number | null;
      count: number;
      change: number | null;
    };
  };
  medications: {
    list: {
      name: string;
      dosage: string;
      frequency: string;
      isPRN: boolean;
      intakesCount: number;
      intakes: {
        date: string;
        scheduledForDate: string | null;
        skipped: boolean;
        note: string | null;
      }[];
      dosageChanges: {
        date: string;
        from: string | null;
        to: string;
      }[];
    }[];
    adherencePercent: number | null;
    expectedDoses: number;
    takenDoses: number;
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
    logs: { name: string; date: string; note: string | null }[];
    count: number;
  };
};
