const en = {
  meta: {
    title: "Moodday",
    description:
      "Digital clinical journal to track your mental health journey with peace of mind",
  },
  language: {
    title: "Language",
    toggleLabel: "Toggle language",
    current: "Current language",
    fr: "Français",
    en: "English",
  },
  nav: {
    docs: "Docs",
    guides: "Guides",
    about: "About",
    contact: "Contact",
    features: "Features",
    pricing: "Pricing",
    blog: "Blog",
    changelog: "Changelog",
    menu: "Menu",
    toggleMenu: "Toggle navigation menu",
    logoAlt: "App logo",
    home: "Home",
    analytics: "Analytics",
    dashboard: "Dashboard",
    organization: "Organization",
    account: "Account",
    app: "App",
    backToSite: "Back to site",
  },
  footer: {
    description:
      "Digital clinical journal to track your mental health journey.",
    product: "Product",
    blog: "Blog",
    documentation: "Documentation",
    guides: "Guides",
    dashboard: "Dashboard",
    account: "Account",
    company: "Company",
    about: "About",
    contact: "Contact",
    legal: "Legal",
    terms: "Terms",
    privacy: "Privacy",
    rights: "© {year} {company}. All rights reserved.",
  },
  actions: {
    close: "Close",
    toggleTheme: "Toggle theme",
    cancel: "Cancel",
    tryAgain: "Try again",
    save: "Save",
    saving: "Saving...",
    edit: "Edit",
    back: "Back",
    previous: "Previous",
    continue: "Continue",
    finish: "Finish",
  },
  common: {
    error: "An error occurred",
    saving: "Saving...",
    unexpectedError: "An unexpected error occurred.",
    redirecting: "Redirecting...",
    selectPlaceholder: "Select an option",
    actionFailed: "Action failed. Please try again.",
    me: "Me",
  },
  medication: {
    add: {
      title: "Add a medication",
      description: "Add a new medication to track",
      submit: "Add medication",
      success: "Medication added!",
    },
    edit: {
      title: "Edit medication",
      submit: "Save changes",
      success: "Medication updated!",
    },
    form: {
      name: "Medication name",
      namePlaceholder: "e.g., Sertraline",
      dosage: "Dosage",
      dosagePlaceholder: "e.g., 50mg",
      dosageHint: "Enter the dosage as shown on your prescription",
      frequency: "Frequency",
      isPRN: "Also taken as needed (PRN)",
      isPRNHint:
        "Check if you sometimes take this medication outside regular schedule",
    },
    frequency: {
      daily: "Once daily",
      twiceDaily: "Twice daily",
      weekly: "Weekly",
      prn: "As needed (PRN)",
    },
    frequencyShort: {
      daily: "Daily",
      twiceDaily: "2x/day",
      weekly: "Weekly",
      prn: "PRN",
    },
    list: {
      title: "My medications",
      emptyTitle: "No medications yet",
      empty: "No medications yet. Add your first medication to start tracking!",
      addNew: "Add medication",
      myTreatments: "My treatments",
      activeCount: "{count} active",
      archived: "Archived medications",
      showArchived: "Show archived",
      hideArchived: "Hide archived",
      takenToday: "Taken today",
      notTaken: "Not taken yet",
    },
    archive: {
      title: "Archive this medication?",
      description:
        "The medication will be hidden from your active list but history will be preserved.",
      confirm: "Archive",
      success: "Medication archived",
    },
    unarchive: {
      success: "Medication restored",
    },
    prn: {
      badge: "PRN",
      section: "As needed",
      also: "Also as needed",
      logged: "PRN medication logged!",
      takenToday: "{count}x today",
      logButton: "Log",
      logTitle: "Log {name}",
      logDescription: "Record taking this medication. Add an optional reason.",
      reasonPlaceholder: "Why did you take it? (optional)",
      confirm: "Log intake",
      todayHistory: "Today's intakes",
    },
    detail: {
      title: "Medication details",
      back: "Back to list",
      edit: "Edit",
      restore: "Restore",
      archived: "Archived",
      dosageHistory: "Dosage history",
      previousDosage: "Previous",
    },
    dosageHistory: {
      title: "Dosage history",
    },
    intake: {
      logged: "Medication taken!",
      loggedOffline: "Intake saved offline",
      skipped: "Medication skipped",
      undone: "Intake cancelled",
      undo: "Cancel",
      skip: "Skip today",
    },
    status: {
      pending: "Pending",
      taken: "Taken",
    },
    today: {
      title: "Today's medications",
      subtitle: "Mark your medications as taken",
      emptyTitle: "Nothing scheduled today",
      empty: "No regular medications. Add one to start tracking!",
      allDone: "All done for today!",
      allDoneSubtext: "Great job staying on track.",
      progress: "{taken} of {total} taken",
      remainingSingular: "{count} remaining",
      remainingPlural: "{count} remaining",
      backToList: "Back to list",
      addMedication: "Add medication",
      regularTitle: "Regular medications",
    },
    quickActions: {
      today: "Today",
      history: "History",
    },
    stats: {
      treatments: "Treatments",
      today: "Today",
      adherence: "Adherence",
    },
    validation: {
      nameRequired: "Medication name is required",
      dosageRequired: "Dosage is required",
    },
  },
  mood: {
    entry: {
      title: "How are you feeling?",
      editTitle: "Edit your mood",
      notePlaceholder: "Add a note (optional)...",
      save: "Save my mood",
      saved: "Mood saved!",
      savedAt: "Saved at {time}",
      addNew: "Add new entry",
      offlineSaved: "Saved offline",
      offlineEditUnavailable: "Editing is unavailable offline.",
      offlineDeleteUnavailable: "Deletion is unavailable offline.",
      update: "Update",
      updated: "Mood updated!",
      delete: "Delete",
      deleted: "Entry deleted",
      deleteTitle: "Delete this entry?",
      deleteDescription:
        "This action cannot be undone. Your mood entry will be permanently removed.",
      deleteConfirm: "Yes, delete it",
    },
    journal: {
      title: "Daily check-in",
      stepLabel: "Step {current} of {total}",
      saved: "Journal saved!",
      saveError: "Unable to save your entry.",
      insight: {
        title: "Insight",
        titleAi: "AI insight",
        loading: "Generating insight...",
        fallback: "Keep tracking to see insights here.",
        localNotice: "Insights are generated locally when offline.",
      },
      step1: {
        title: "How are you feeling?",
        subtitle: "Rate your mood, energy, and anxiety.",
        moodLabel: "Mood",
        moodScale: {
          low: "Low",
          mid: "Okay",
          high: "High",
        },
        energyLabel: "Energy",
        energyScale: {
          low: "Low",
          mid: "Moderate",
          high: "High",
        },
        anxietyLabel: "Anxiety",
        anxietyScale: {
          low: "Low",
          mid: "Moderate",
          high: "High",
        },
      },
      step2: {
        title: "Sleep",
        subtitle: "How did you sleep last night?",
        durationLabel: "Hours of sleep",
        qualityLabel: "Sleep quality",
        disturbancesLabel: "Disturbances",
      },
      step3: {
        title: "Medications",
        subtitle: "Mark your medications and side effects.",
        markTaken: "Mark taken",
        addOneOff: "Add one-off medication",
        noMeds: "No medications configured",
        sideEffectsTitle: "Side effects",
        sideEffectsPlaceholder: "Any side effects today? (optional)",
      },
      step4: {
        title: "Symptoms and events",
        subtitle: "Anything notable today?",
        symptomsLabel: "Symptoms",
        eventsLabel: "Events",
      },
      step5: {
        title: "Notes",
        subtitle: "Anything else you'd like to remember?",
        placeholder: "Write a short note...",
      },
    },
    page: {
      description: "Log your mood and journal entries.",
    },
    slider: {
      aria: "Mood slider",
      emojiAria: "Mood emoji {value}",
      currentValueAria: "Current mood value {value}",
    },
    history: {
      title: "Mood History",
      empty: "No mood entries yet. Start tracking your mood!",
      filter: {
        all: "All time",
        week: "Last 7 days",
        month: "Last 30 days",
        quarter: "Last 90 days",
      },
    },
  },
  therapy: {
    add: {
      title: "New therapy session",
      description: "Record your therapy session notes and reflections",
      submit: "Save session",
      success: "Session saved! Take care of yourself 💙",
      offlineSaved: "Saved offline. It will sync when you are back online.",
    },
    edit: {
      title: "Edit session",
      description: "Update your session notes and details",
      submit: "Save changes",
      success: "Session updated!",
    },
    form: {
      date: "Session date",
      selectDate: "Select a date",
      notes: "Session notes",
      notesPlaceholder: "What did you discuss? How did you feel? Any insights?",
      notesHint: "Write freely, this is your private space",
      benefitRating: "How beneficial was this session?",
      benefitRatingHint: "Optional - rate from 1 to 5 stars",
    },
    list: {
      title: "Therapy sessions",
      mySessions: "My sessions",
      sessionCount: "{count} sessions",
      empty: "No sessions yet. Record your first therapy session!",
      addNew: "Add session",
    },
    delete: {
      title: "Delete this session?",
      description: "This action cannot be undone.",
      confirm: "Yes, delete it",
      success: "Session deleted",
    },
    validation: {
      notesRequired: "Notes are required",
    },
  },
  exercise: {
    add: {
      title: "New exercise",
      description: "Add a wellness exercise to track",
      submit: "Add exercise",
      success: "Exercise added!",
    },
    edit: {
      title: "Edit exercise",
      description: "Update your wellness exercise details",
      submit: "Save changes",
      success: "Exercise updated!",
    },
    form: {
      name: "Exercise name",
      namePlaceholder: "e.g., Deep breathing, Meditation, Walk",
      description: "Description (optional)",
      descriptionPlaceholder: "How to do this exercise...",
      descriptionHint: "Optional - describe how to do this exercise",
    },
    list: {
      title: "My exercises",
      myExercises: "My exercises",
      activeCount: "{count} active",
      empty: "No exercises yet. Add your first wellness exercise!",
      addNew: "Add exercise",
      archived: "Archived exercises",
      showArchived: "Show archived",
      hideArchived: "Hide archived",
    },
    log: {
      logged: "Exercise completed! 🎉",
      undone: "Log cancelled",
      undo: "Cancel",
      button: "Done",
      todayCount: "{count}x today",
    },
    archive: {
      title: "Archive this exercise?",
      description: "The exercise will be hidden but history preserved.",
      confirm: "Archive",
      success: "Exercise archived",
    },
    unarchive: {
      success: "Exercise restored",
    },
    validation: {
      nameRequired: "Exercise name is required",
    },
  },
  insights: {
    title: "Dashboard",
    chart: {
      title: "Mood over 30 days",
      noData: "No mood data yet. Start tracking your mood!",
      mood: "Mood",
      dosageChange: "Dosage change",
    },
    dashboard: {
      mood: {
        title: "Mood",
        average: "Weekly average",
        noData: "No data",
      },
      medications: {
        title: "Medications",
        taken: "{count} taken today",
        adherence: "{percent}% adherence",
        noMeds: "No medications",
      },
      therapy: {
        title: "Therapy",
        lastSession: "Last session",
        sessions: "{count} sessions this month",
        noSessions: "No sessions yet",
      },
      exercises: {
        title: "Exercises",
        completed: "{count} this week",
        noExercises: "No exercises",
      },
    },
    patterns: {
      title: "Insights",
      noInsights: "Keep tracking to see insights!",
      mood: {
        avg: {
          high: "Your average mood is {value}/10. Keep up the momentum.",
          mid: "Your average mood is {value}/10. Steady and consistent.",
          low: "Your average mood is {value}/10. Consider extra support.",
        },
        weekendHigher: "Your mood tends to be higher on weekends.",
        weekdayHigher: "Your mood tends to be higher on weekdays.",
      },
      medication: {
        high: "Medication adherence is {value}%. Great consistency.",
        mid: "Medication adherence is {value}%. Keep building the habit.",
        low: "Medication adherence is {value}%. Reminders might help.",
      },
      therapy: {
        improved: "Therapy sessions increased to {count} this month.",
        steady: "Therapy sessions stayed steady at {count} this month.",
        lower: "Therapy sessions decreased to {count} this month.",
      },
      exercise: {
        completed: "{count} exercises completed this month.",
      },
    },
    streak: {
      subtitle: {
        long: "Amazing streak: {count} days!",
        weeks: "{weeks} weeks in a row. Keep going!",
        week: "A full week! Nice work.",
        goodStart: "Great start: {count} days in a row.",
        zero: "Start your first streak today.",
        one: "{count} day logged. Keep it up!",
        few: "{count} days in a row. Nice progress!",
      },
    },
  },
  dashboard: {
    greeting: "Hello {name}",
    defaultName: "User",
    today: "Today is {date}",
    quickMood: {
      title: "Quick mood check-in",
      subtitle: "Log your mood in seconds",
      badge: "Daily",
      save: "Save mood",
    },
    trend: {
      title: "Mood trend",
      range7d: "Last 7 days",
    },
    medications: {
      title: "Today's medications",
      history: "History",
      empty: "No medications scheduled for today.",
    },
    caregivers: {
      title: "Caregiver circle",
      empty: "No caregivers yet",
      defaultName: "Caregiver",
      statusActive: "Active",
      statusPending: "Pending",
    },
    sleep: {
      title: "Sleep",
      averageHours: "{hours}h average",
      qualityLabel: "Quality",
      qualityPoor: "Poor",
      qualityAverage: "Average",
      qualityExcellent: "Excellent",
      energyLabel: "Energy",
      avgMoodLabel: "Avg mood",
      noData: "No sleep data yet.",
    },
    insights: {
      title: "Insights",
      detectedLabel: "Detected pattern:",
      sampleOne: "You tend to feel better after nights with 7+ hours of sleep.",
      sampleTwo: "Medication adherence is linked with more stable mood scores.",
      viewMore: "View more insights",
    },
  },
  streak: {
    title: "Your streak",
    daySingular: "day",
    dayPlural: "days",
    weekProgress: "{count} of 7 days",
  },
  breathing: {
    phases: {
      inhale: "Inhale",
      hold: "Hold",
      exhale: "Exhale",
      rest: "Rest",
    },
    ready: "Ready",
    start: "Start",
    pause: "Pause",
    reset: "Reset",
    cycleCount: "{count} cycles",
    instructionsTitle: "How it works",
    instructions:
      "Follow the circle to inhale, hold, and exhale. Repeat for a few cycles.",
  },
  crisis: {
    metaTitle: "Crisis resources",
    metaDescription: "Immediate support resources and grounding tools.",
    title: "Crisis resources",
    subtitle: "If you feel unsafe, reach out now. You deserve support.",
    emergency: {
      title: "Emergency",
      call: "Call",
      samu: "15",
      or: "or",
      eu: "112",
    },
    sections: {
      hotlines: "Hotlines",
      emergency: "Emergency services",
      support: "Support organizations",
    },
    breathing: {
      title: "Guided breathing",
      badge: "4-7-8 exercise",
    },
    safety: {
      title: "Safety plan",
      description: "Review your plan and contacts when you need them.",
      cta: "Open safety plan",
    },
    reassurance: {
      title: "You are not alone",
      emphasis: "Help is available.",
      body: "Reaching out can be the first step to feeling safer.",
    },
    tips: {
      title: "Grounding tips",
      items: [
        {
          title: "Breathe slowly",
          description: "Inhale for 4 seconds, hold for 7, exhale for 8.",
        },
        {
          title: "Name five things",
          description:
            "Name 5 things you see, 4 you feel, 3 you hear, 2 you smell, 1 you taste.",
        },
        {
          title: "Reach out",
          description: "Call someone you trust or a support line.",
        },
      ],
    },
    actions: {
      sms: "Text",
      website: "Website",
    },
    fab: {
      call: "Call 3114",
      resources: "Resources",
      needHelp: "Need help?",
    },
    resources: {
      "3114": {
        name: "3114 - Suicide prevention line",
        description: "National suicide prevention hotline (France).",
        availability: "24/7",
      },
      sosAmitie: {
        name: "SOS Amitie",
        description: "Listening service for people in distress.",
        availability: "See website for hours",
      },
      filSanteJeunes: {
        name: "Fil Sante Jeunes",
        description: "Support line for young people.",
        availability: "See website for hours",
      },
      samu: {
        name: "SAMU",
        description: "Emergency medical services.",
        availability: "Emergency service",
      },
      suicideEcoute: {
        name: "Suicide Ecoute",
        description: "Listening and support in crisis.",
        availability: "See website for hours",
      },
      argos: {
        name: "SOS Argos",
        description: "Support for people with bipolar disorder and families.",
      },
    },
  },
  labels: {
    symptoms: {
      anxiety: "Anxiety",
      irritability: "Irritability",
      ruminations: "Ruminations",
      agitation: "Agitation",
      brain_fog: "Brain fog",
      tension: "Tension",
      sadness: "Sadness",
      euphoria: "Euphoria",
    },
    events: {
      work: "Work",
      family: "Family",
      sport: "Sport",
      alcohol: "Alcohol",
      conflict: "Conflict",
      social_outing: "Social outing",
      bad_news: "Bad news",
      success: "Success",
    },
    sleepDisturbances: {
      nightmares: "Nightmares",
      multiple_awakenings: "Multiple awakenings",
      initial_insomnia: "Difficulty falling asleep",
      agitation: "Agitation",
      night_sweats: "Night sweats",
      early_awakening: "Early awakening",
    },
    contextTags: {
      work: "Work",
      family: "Family",
      social: "Social",
      health: "Health",
      sleep: "Sleep",
      exercise: "Exercise",
      medication: "Medication",
      therapy: "Therapy",
      stress: "Stress",
      relaxation: "Relaxation",
      creative: "Creative",
      nature: "Nature",
      travel: "Travel",
      finance: "Finance",
      relationship: "Relationship",
    },
    sideEffects: {
      nausea: "Nausea",
      headache: "Headache",
      dizziness: "Dizziness",
      fatigue: "Fatigue",
      insomnia: "Insomnia",
      drowsiness: "Drowsiness",
      dry_mouth: "Dry mouth",
      appetite_change: "Appetite change",
      weight_change: "Weight change",
      tremor: "Tremor",
      anxiety: "Anxiety",
      restlessness: "Restlessness",
      constipation: "Constipation",
      blurred_vision: "Blurred vision",
      sweating: "Sweating",
    },
    sleepQuality: {
      bad: "Poor",
      average: "Average",
      good: "Good",
    },
    caregiver: {
      moodObserved: {
        very_good: "Very good",
        good: "Good",
        neutral: "Neutral",
        down: "Down",
        very_down: "Very down",
        concerning: "Concerning",
      },
      energyObserved: {
        high: "High",
        normal: "Normal",
        low: "Low",
        very_low: "Very low",
      },
      socialBehavior: {
        engaged: "Engaged",
        normal: "Normal",
        withdrawn: "Withdrawn",
        isolated: "Isolated",
      },
      sleepObserved: {
        good: "Good sleep",
        restless: "Restless",
        insomnia: "Insomnia",
        oversleeping: "Oversleeping",
      },
      eventTypes: {
        compulsive_purchase: "Compulsive purchase",
        crisis: "Crisis",
        conflict: "Conflict",
        milestone: "Milestone",
        medication_issue: "Medication issue",
        other: "Other",
      },
    },
  },
  export: {
    title: "Export for consultation",
    description:
      "Generate a PDF summary to share with your healthcare provider",
    presets: {
      twoWeeks: "2 weeks",
      oneMonth: "1 month",
      threeMonths: "3 months",
    },
    dateRange: {
      title: "Select period",
      start: "Start date",
      end: "End date",
      invalidRange: "End date must be after start date",
    },
    preview: {
      title: "Export preview",
      moodEntries: "{count} mood entries",
      therapySessions: "{count} therapy sessions",
      exerciseLogs: "{count} exercises",
      averageMood: "Average mood",
      adherence: "Adherence",
      medications: "Medications",
    },
    actions: {
      preview: "Preview",
      download: "Download PDF",
      modifyPeriod: "Modify period",
    },
    download: {
      success: "PDF downloaded!",
    },
    pdf: {
      title: "Moodday summary for {name}",
      period: "Period: {start} – {end}",
      sections: {
        mood: "Mood",
        medications: "Medications",
        therapy: "Therapy ({count})",
        exercises: "Exercises ({count})",
      },
      stats: {
        average: "Average",
        min: "Min",
        max: "Max",
        entries: "Entries",
      },
      moreEntries: "And {count} more entries...",
      noMoodEntries: "No mood entries for this period.",
      adherence: "Adherence",
      intakeSingular: "intake",
      intakePlural: "intakes",
      dosageChanges: "Dosage changes",
      noMedications: "No medications for this period.",
      benefitRating: "Benefit rating: {value}/5",
      noTherapy: "No therapy sessions for this period.",
      footer: "Generated on {date} by Moodday",
    },
  },
  trends: {
    metaTitle: "Trends",
    metaDescription: "Explore mood trends and correlations over time.",
    title: "Trends",
    subtitle: "Understand patterns across mood, sleep, and treatments.",
    periods: {
      days7: "Last 7 days",
      days30: "Last 30 days",
      days90: "Last 90 days",
    },
    stats: {
      last7Days: "Last 7 days",
      vs30Days: "vs 30 days",
      last30Days: "Last 30 days",
      last90Days: "Last 90 days",
    },
    chart: {
      title: "Mood over time",
      entries: "{count} entries",
      legend: {
        mood: "Mood",
        dosageChange: "Dosage change",
      },
    },
    correlations: {
      title: "Correlations",
      sleepMood: "Sleep quality vs mood",
      medicationStability: "Medication adherence vs mood stability",
      energyMood: "Energy vs mood",
    },
    insights: {
      title: "Notable insights",
      empty: "No insights yet. Keep tracking.",
      trendUp: "Trend up",
      trendDown: "Trend down",
    },
  },
  onboarding: {
    title: "Welcome to Moodday",
    next: "Continue",
    skip: "Skip for now",
    start: "Get started",
    complete: "Welcome! You're all set.",
    errors: {
      missingMedicationInfo: "Add a medication name and dosage.",
      invalidInviteEmail: "Enter a valid caregiver email.",
    },
    mood: {
      label: "Mood today",
      anxietyLabel: "Anxiety level",
      noteLabel: "Optional note",
      notePlaceholder: "Add a note...",
    },
    medication: {
      nameLabel: "Medication name",
      namePlaceholder: "e.g., Sertraline",
      dosageLabel: "Dosage",
      dosagePlaceholder: "e.g., 50mg",
      frequencyLabel: "Frequency",
      laterHint: "You can add more details later.",
    },
    preferences: {
      invite: {
        title: "Invite a caregiver",
        description: "Share your progress with someone you trust.",
        emailPlaceholder: "Caregiver email",
        labelPlaceholder: "Optional label (e.g., Dr. Smith)",
      },
    },
    steps: {
      welcome: {
        title: "Welcome to Moodday",
        description:
          "Your personal companion for tracking your mental health journey. No judgment, just support.",
      },
      mood: {
        title: "Track your mood",
        description:
          "Log how you're feeling each day to understand your patterns and see how your treatment is working.",
      },
      medications: {
        title: "Manage your medications",
        description:
          "Keep track of your medications and dosages. See correlations between your treatment and your mood.",
      },
      preferences: {
        title: "Notifications & caregivers",
        description:
          "Set your reminders and, if you want, invite a trusted caregiver.",
      },
      ready: {
        title: "You're all set!",
        description:
          "Start your journey today. Remember, every step counts and you're doing great just by being here.",
      },
    },
  },
  patient: {
    nav: {
      main: "Main",
      tracking: "Tracking",
      tools: "Tools",
      support: "Support",
      mood: "My mood",
      medications: "Medications",
      exercises: "Exercises",
      therapy: "Therapy",
      export: "Export",
      trends: "Trends",
      caregiver: "Caregiver",
      crisis: "Crisis resources",
    },
  },
  caregiver: {
    roles: {
      family: "Family",
      friend: "Friend",
      professional: "Professional",
      default: "Caregiver",
    },
    dashboard: {
      metaTitle: "Caregiver dashboard",
      metaDescription:
        "Support a loved one by sharing observations and events with consent.",
      title: "Caregiver dashboard",
      newObservation: "New observation",
      stats: {
        week: "This week",
        month: "This month",
        events: "Events",
        concerning: "Concerning events",
      },
      tips: {
        title: "Helpful tip",
        highlight: "Stay consistent",
        body: "Short, kind check-ins build trust and reveal patterns over time.",
      },
      actions: {
        checkin: {
          title: "Log a check-in",
          subtitle: "Share mood, energy, sleep, and behavior.",
        },
        event: {
          title: "Report an event",
          subtitle: "Note important incidents or changes.",
        },
        invite: {
          title: "Invite a caregiver",
          subtitle: "Add someone you trust to the circle.",
        },
      },
      activity: {
        title: "Recent activity",
        entry: "entry",
        entries: "entries",
        moodLabel: "Mood",
        energyLabel: "Energy",
        severity: "Severity",
        badgeObservation: "Observation",
        emptyTitle: "No activity yet",
        emptyDescription: "Create your first check-in to start tracking.",
        emptyCta: "Create check-in",
      },
      circle: {
        title: "Caregiver circle",
        default: "Caregiver",
        empty: "No caregivers yet",
        inviteCta: "Invite someone",
        removeTitle: "Remove caregiver?",
        removeDescription: "Access to shared data will be revoked.",
        removeConfirm: "Remove",
        statusPending: "Pending",
      },
      patients: {
        title: "Patients",
        empty: "No patients yet",
      },
      inviteDialog: {
        title: "Invite a caregiver",
        description: "Invite someone you trust to support you.",
        emailLabel: "Email",
        emailPlaceholder: "caregiver@example.com",
        roleLabel: "Role",
        labelLabel: "Label (optional)",
        labelPlaceholder: "e.g., Dr. Smith",
        send: "Send invite",
        sending: "Sending...",
      },
      toasts: {
        inviteSent: "Invite sent",
        removed: "Caregiver removed",
      },
    },
    activity: {
      emptyTitle: "No activity yet",
      emptyDescription: "Caregiver check-ins and events will appear here.",
      badgeObservation: "Observation",
      moodLabel: "Mood: {value}",
      energyLabel: "Energy: {value}",
      severityLabel: "Severity: {value}",
    },
    observe: {
      title: "New observation",
      description: "Share an observation or event with consent.",
      tabCheckin: "Check-in",
      tabEvent: "Event",
      patientLabel: "Patient",
      patientPlaceholder: "Select a patient",
    },
    checkin: {
      for: "Check-in for {name}",
      moodObserved: "Observed mood",
      energyObserved: "Observed energy",
      sleepObserved: "Sleep observed",
      socialBehavior: "Social behavior",
      notesLabel: "Notes",
      notesPlaceholder: "Add optional notes...",
      visibleLabel: "Visible to patient",
      visibleDescription: "The patient will see this check-in.",
      submit: "Save check-in",
      saved: "Check-in saved",
      saveError: "Unable to save check-in",
    },
    event: {
      for: "Event for {name}",
      typeLabel: "Event type",
      dateLabel: "Date",
      descriptionLabel: "Description",
      descriptionPlaceholder: "Describe what happened...",
      severityLabel: "Severity",
      severityScaleMin: "Low",
      severityScaleMax: "High",
      severityLabels: {
        minor: "Minor",
        low: "Low",
        moderate: "Moderate",
        high: "High",
        critical: "Critical",
      },
      visibleLabel: "Visible to patient",
      visibleDescription: "The patient will see this event.",
      submit: "Save event",
      saved: "Event saved",
      saveError: "Unable to save event",
      validation: {
        typeRequired: "Select an event type",
        descriptionMin: "Description must be at least 10 characters",
      },
    },
    invite: {
      title: "Caregiver invite",
      loading: "Loading invite...",
      invalid: "This invite is invalid.",
      accept: "Accept",
      decline: "Decline",
      accepting: "Accepting...",
      declining: "Declining...",
      accepted: "Invite accepted",
      declined: "Invite declined",
      alreadyAccepted: "This invite was already accepted.",
      alreadyDeclined: "This invite was already declined.",
      pendingSubtitle: "You have been invited to a caregiver circle.",
      signInRequiredTitle: "Sign in required",
      signInRequiredDescription: "Please sign in to accept this invite.",
      notFoundTitle: "Invite not found",
      notFoundDescription: "This invite is invalid or has expired.",
    },
    inviteEmail: {
      subject: "You're invited to a Moodday caregiver circle",
      preview: "{patientName} invited you to join Moodday",
      greeting: "Hello,",
      intro:
        "{patientName} invited you to join their caregiver circle as {roleLabel}.",
      labelLine: "Label: {label}",
      patientFallback: "Someone you know",
      cta: "Accept invite",
      ignore: "If you were not expecting this, you can ignore this email.",
    },
    errors: {
      selfInvite: "You cannot invite yourself.",
      alreadyInCircle: "This caregiver is already in your circle.",
      pendingInvite: "An invite is already pending for this person.",
      invalidInvite: "This invite is invalid.",
      invalidOrExpiredInvite: "This invite is invalid or expired.",
      inviteExpired: "This invite has expired.",
      inviteNotForYou: "This invite is not for you.",
      inviteAlreadyAccepted: "This invite has already been accepted.",
      acceptOwnInvite: "You cannot accept your own invite.",
      relationshipNotFoundOrUnauthorized:
        "Relationship not found or unauthorized.",
      relationshipNotFound: "Relationship not found.",
      relationshipDeleteNotAllowed: "You cannot remove this relationship.",
      insufficientObservationPermission:
        "You do not have permission to add observations.",
      insufficientEventPermission:
        "You do not have permission to report events.",
      notAllowedObserve: "You are not allowed to add observations.",
      notAllowedReportEvent: "You are not allowed to report events.",
    },
  },
  settings: {
    title: "Settings",
    subtitle: "Manage your preferences, privacy, and subscription.",
    tabs: {
      profile: "Profile",
      notifications: "Notifications",
      appearance: "Appearance",
      privacy: "Privacy",
      subscription: "Subscription",
      security: "Security",
      language: "Language",
    },
    manageAccount: "Manage account",
    profile: {
      title: "Profile",
      defaultName: "Your name",
      changePhoto: "Change photo",
      fullName: "Full name",
      fullNamePlaceholder: "Your full name",
      timezone: "Time zone",
      save: "Save profile",
    },
    display: {
      title: "Display",
      chartPeriod: "Default chart period",
      chartPeriodHint: "Default time range for mood charts",
      days7: "7 days",
      days30: "30 days",
      days90: "90 days",
    },
    notifications: {
      title: "Notifications",
      enabled: "Enable notifications",
      enabledHint: "Receive reminders and updates",
      dailyCheckIn: "Daily check-in reminder",
      dailyCheckInHint: "Reminder to log your mood",
      checkInTime: "Check-in time",
      medicationReminders: "Medication reminders",
      medicationRemindersHint: "Reminders to take your medications",
      medicationReminderTime: "Medication reminder time",
      medicationReminderTimeHint: "Choose when to receive medication reminders",
    },
    appearance: {
      title: "Appearance",
      themeLabel: "Theme",
    },
    privacy: {
      title: "Privacy & data",
      exportJson: "Export JSON",
      exportJsonDescription: "Download your full data export (GDPR).",
      exportPdf: "Export PDF",
      exportPdfDescription: "Generate a clinical PDF summary.",
      exportSuccess: "Export ready",
      exporting: "Exporting...",
      deleteTitle: "Delete account",
      deleteWarning: "This will permanently delete your data.",
      deleteDialogTitle: "Confirm deletion",
      deleteDialogDescription: "This action cannot be undone.",
      deleteConfirm: "Delete my account",
      deleting: "Deleting...",
      accountDeleted: "Account deleted",
      policyTitle: "Privacy policy",
      policyDescription: "Read how we handle your data.",
      policyCta: "Read policy",
    },
    security: {
      description:
        "Manage sign-in details and protect your account with secure credentials.",
    },
    subscription: {
      title: "Subscription",
      statusLabel: "Status",
      status: {
        active: "Active",
        trialing: "Trial",
        pastDue: "Past due",
        canceled: "Canceled",
        incomplete: "Incomplete",
        inactive: "Inactive",
      },
      planLabel: "Plan: {plan}",
      planFree: "Free plan",
      renewal: "Renews on {date}",
      noActive: "No active subscription",
      includedTitle: "Included features",
      features: [
        "Unlimited mood tracking",
        "Medication reminders",
        "PDF export",
      ],
      changePlan: "Change plan",
    },
    timezones: {
      paris: "Paris",
      london: "London",
      newYork: "New York",
    },
    saved: "Settings saved!",
    sidebar: {
      profile: "Profile",
      notifications: "Notifications",
      appearance: "Appearance",
      privacy: "Privacy",
      subscription: "Subscription",
      security: "Security",
      language: "Language",
    },
    upgrade: "Upgrade to Premium",
  },
  debug: {
    title: "Debug Panel",
    info: "Info",
    actions: "Actions",
    noActions: "No actions registered",
    user: "User",
    session: "Session",
    notLoggedIn: "Not logged in",
    null: "null",
  },
  theme: {
    title: "Theme",
    dark: "Dark",
    light: "Light",
    system: "System",
    zen: "Zen",
  },
  sidebar: {
    title: "Sidebar",
    description: "Displays the mobile sidebar.",
    toggle: "Toggle sidebar",
  },
  breadcrumb: {
    label: "Breadcrumb",
    more: "More",
  },
  pagination: {
    label: "Pagination",
    previous: "Previous",
    next: "Next",
    previousAria: "Go to previous page",
    nextAria: "Go to next page",
    more: "More pages",
  },
  months: {
    january: "January",
    february: "February",
    march: "March",
    april: "April",
    may: "May",
    june: "June",
    july: "July",
    august: "August",
    september: "September",
    october: "October",
    november: "November",
    december: "December",
  },
  images: {
    dropHere: "Drop here",
    upload: "Upload",
    onlyAccept: "Only accepts: {types}",
    errors: {
      uploadFailed: "Upload failed",
      invalidType: "Invalid file type",
      invalidTypeDescription: "Only png, jpg, jpeg are allowed",
      fileTooLarge: "File too large (max 1 MB)",
      fileTooLargeDescription: "Use https://tinypng.com/ to compress the image",
    },
  },
  feedback: {
    button: "Feedback",
    message: "Message",
    send: "Send",
    sent: "Feedback sent",
  },
  support: {
    contact: "Contact support",
    title: "Contact support",
    descriptionPrefix: "You can reach us at ",
    descriptionSuffix: " and we will reply as soon as possible.",
    subject: "Subject",
    message: "Message",
    send: "Send",
    sent: "Message sent",
  },
  pricing: {
    title: "Simple, transparent pricing",
    description: "Choose the plan that fits your needs.",
    monthly: "Monthly",
    yearly: "Yearly",
    save: "Save {percent}",
    footer: "Cancel anytime. No hidden fees.",
    customPlan: "Need a custom plan?",
    contact: "Contact us",
    checkoutCanceled: {
      title: "Checkout canceled",
      description: "No worries — you can upgrade whenever you're ready.",
      back: "Back to pricing",
    },
    dialog: {
      title: "Choose a plan and start growing",
      description: "Unlock full access to our features and grow your business.",
    },
  },
  pricingCard: {
    mostPopular: "Most popular",
    perMonth: "/mo",
    save: "Save {percent}",
    billedYearly: "Billed yearly: {amount}",
    freeTrial: "{days}-day free trial",
    includes: "Includes",
    signInRequired: "Please sign in to upgrade",
    upgradeError: "Unable to start checkout",
    ctaFree: "Start for free",
    ctaMonthly: "Choose monthly",
    ctaYearly: "Choose yearly",
  },
  plans: {
    names: {
      free: "Free",
      pro: "Pro",
      ultra: "Ultra",
    },
    descriptions: {
      free: "Daily mood tracking and basic journal",
      pro: "Full tracking with unlimited medications, history and caregivers",
      ultra: "All Pro features + priority support",
    },
    limits: {
      medications: {
        label: "{value} medications",
        labelUnlimited: "Unlimited medications",
        description: "Track your treatments",
      },
      historyDays: {
        label: "{value} days history",
        labelUnlimited: "Full history",
        description: "Access to your past data",
      },
      caregivers: {
        label: "{value} caregivers",
        labelUnlimited: "Unlimited caregivers",
        labelNone: "No caregivers",
        description: "Share with your loved ones",
      },
    },
    additionalFeatures: {
      free: [
        {
          label: "Daily mood tracking",
          description: "Record your mood every day",
        },
        {
          label: "Basic journal",
          description: "Write down your thoughts and emotions",
        },
      ],
      pro: [
        {
          label: "PDF export",
          description: "Export your data for your doctor",
        },
        {
          label: "AI insights",
          description: "Personalized analysis of your trends",
        },
        {
          label: "Email support",
          description: "Dedicated email assistance",
        },
      ],
      ultra: [
        {
          label: "Priority support",
          description: "Fast response to your requests",
        },
        {
          label: "Exportable data",
          description: "Full export of all your data",
        },
      ],
    },
  },
  app: {
    searchPlaceholder: "Search...",
    commandTitle: "Command Palette",
    commandDescription: "Search for a command to run...",
    commandPlaceholder: "Type a command or search...",
    commandEmpty: "No results found.",
    analytics: {
      title: "Analytics overview",
      description: "Track your performance and understand your audience.",
    },
    cards: {
      totalLikes: "Total likes",
      totalLikesDelta: "+12% from last month",
      totalThreads: "Total threads",
      totalThreadsDelta: "+8% from last month",
      newSubscribers: "New subscribers",
      newSubscribersDelta: "+5% from last month",
      impressions: "Impressions",
      impressionsDelta: "+18% from last month",
    },
    subscribers: {
      title: "Subscribers",
      description: "New subscribers over time",
      trending: "Trending up by {value} this month",
      range: "January - June {year}",
    },
    upgrade: {
      title: "Upgrade your plan",
      description: "Unlock more features for your account.",
      cta: "Upgrade now",
    },
  },
  admin: {
    panel: "Admin Panel",
    nav: {
      section: "Admin",
    },
    dashboard: {
      title: "Admin Dashboard",
    },
    stats: {
      totalUsers: "Total users",
      totalUsersDescription: "All registered accounts",
      premiumUsers: "Premium users",
      premiumUsersDescription: "Active paid subscriptions",
      mrr: "Monthly recurring revenue",
      mrrDescription: "Estimated monthly revenue",
      newUsersThisMonth: "+{count} this month",
    },
    feedback: {
      title: "Feedback",
      description: "Review feedback from your users.",
      searchPlaceholder: "Search feedback...",
      empty: "No feedback found.",
      detailTitle: "Feedback details",
      submitted: "Submitted",
      viewDetails: "View details",
      noRating: "No rating",
      ratings: {
        extremelyDissatisfied: "Extremely dissatisfied",
        somewhatDissatisfied: "Somewhat dissatisfied",
        neutral: "Neutral",
        satisfied: "Satisfied",
      },
      reply: {
        button: "Reply",
        title: "Reply to feedback",
        description: "Send a reply to {name}.",
        message: "Message",
        placeholder: "Write your reply...",
        send: "Send reply",
        sent: "Reply sent",
        failed: "Failed to send reply",
      },
    },
    users: {
      title: "Users",
      searchPlaceholder: "Search users...",
      empty: "No users found.",
      actionsMenu: "Open actions menu",
      actions: {
        impersonate: "Impersonate",
        makeAdmin: "Make admin",
        makeUser: "Make user",
        unban: "Unban",
        ban: "Ban",
      },
      status: {
        active: "Active",
        banned: "Banned",
      },
      roles: {
        admin: "Admin",
        user: "User",
      },
      banReason: "Violation of terms",
      banConfirm: "Ban {name}?",
      banFailed: "Failed to ban user: {error}",
      banned: "User banned",
      unbanFailed: "Failed to unban user: {error}",
      unbanned: "User unbanned",
      impersonating: "Impersonating user",
      impersonateFailed: "Failed to impersonate user: {error}",
      roleUpdated: "Role updated",
      roleUpdateFailed: "Failed to update role: {error}",
      stopImpersonating: "Stop impersonating",
      anonymous: "Anonymous",
      noEmail: "No email",
      unverified: "Unverified",
      table: {
        user: "User",
        role: "Role",
        status: "Status",
        joined: "Joined",
        created: "Created",
        actions: "Actions",
      },
    },
    userDetails: {
      title: "User details",
      description: "Manage account information and sessions.",
      subscriptionTitle: "Subscription",
      subscriptionStatus: {
        active: "Active",
        canceled: "Canceled",
        trialing: "Trialing",
        past_due: "Past due",
        unpaid: "Unpaid",
        incomplete: "Incomplete",
      },
      noSubscription: "No subscription found.",
      noName: "Unnamed user",
      created: "Created",
      providers: {
        title: "Connected providers",
        description: "External accounts linked to this user.",
        empty: "No providers connected.",
        emailPassword: "Email/password",
        status: {
          active: "Active",
          connected: "Connected",
          inactive: "Inactive",
        },
        table: {
          provider: "Provider",
          status: "Status",
          connected: "Connected on",
          accountId: "Account ID",
        },
      },
      sessions: {
        title: "Sessions",
        description: "Active sessions for this user.",
        loading: "Loading sessions...",
        loadFailed: "Failed to load sessions: {error}",
        empty: "No sessions found.",
        revokeAllTitle: "Revoke all sessions",
        revokeAllDescription: "This will sign the user out everywhere.",
        revokeAllAction: "Revoke all",
        revokeAllFailed: "Failed to revoke sessions: {error}",
        revokedAll: "All sessions revoked",
        revokeFailed: "Failed to revoke session: {error}",
        revoked: "Session revoked",
        table: {
          device: "Device",
          ip: "IP address",
          status: "Status",
          created: "Created",
          expires: "Expires",
          actions: "Actions",
        },
        status: {
          active: "Active",
          expired: "Expired",
          impersonated: "Impersonated",
        },
        unknownDevice: "Unknown device",
        unknownBrowser: "Unknown browser",
        unknownOs: "Unknown OS",
        unknownIp: "Unknown IP",
        deviceFormat: "{browser} on {os}",
      },
    },
  },
  account: {
    title: "Account",
    metaTitle: "Account",
    metaDescription: "Manage your account settings",
    settings: {
      title: "Account settings",
      signOut: "Sign out",
    },
    profile: {
      section: "Your profile",
      profile: "Profile",
      mail: "Email",
      danger: "Danger",
      updated: "Profile updated",
      verifySent: "Verification email sent",
      verifyEmail: "Verify email",
      verifiedTooltip: "Email verified",
      changeEmail: "Change email",
      changePassword: "Change password",
      editTitle: "Settings",
      editDescription: "Update your profile.",
    },
    password: {
      title: "Change password",
      description: "Update your password to keep your account secure.",
      currentRequired: "Current password is required",
      minLength: "Password must be at least 8 characters",
      mismatch: "Passwords do not match",
      currentLabel: "Current password",
      newLabel: "New password",
      confirmLabel: "Confirm password",
      revokeLabel: "Sign out of other devices",
      revokeDescription: "End all other active sessions.",
      submit: "Update password",
      success: "Password updated",
    },
    email: {
      metaTitle: "Email preferences",
      metaDescription: "Manage your email preferences.",
      title: "Email preferences",
      description: "Choose what emails you want to receive.",
      changeTitle: "Change email",
      changeDescription: "Update your email address.",
      newLabel: "New email",
      newPlaceholder: "you@example.com",
      changeSubmit: "Send verification link",
      invalid: "Enter a valid email address",
      verifySent: "Verification email sent",
      unsubscribeLabel: "Unsubscribe",
      unsubscribeDescription: "Stop receiving product updates.",
      updated: "Preferences updated",
      errorTitle: "Email settings unavailable",
      errorDescription: "We could not load your email preferences.",
    },
    billing: {
      metaTitle: "Billing",
      metaDescription: "Manage your subscription and billing details.",
      title: "Billing",
      freeTitle: "You are on the free plan",
      freeDescription: "Upgrade to unlock premium features.",
      manage: "Manage subscription",
      cancel: "Cancel subscription",
      reactivate: "Reactivate",
      cancelTitle: "Cancel subscription",
      cancelDescription: "Tell us why you're leaving so we can improve.",
      cancelReasonLabel: "Reason for cancellation",
      cancelDetailsLabel: "Additional details",
      cancelDetailsPlaceholder: "Tell us more...",
      cancelDetailsMin: "Please add more details",
      cancelConfirm: "Confirm cancellation",
      cancelBack: "Keep subscription",
      cancelError: "Unable to cancel subscription",
      cancelRedirect: "Redirecting to billing portal...",
      cancelReasons: {
        tooExpensive: "Too expensive",
        notUsing: "Not using enough",
        missingFeatures: "Missing features",
        bugs: "Too many bugs",
        competitor: "Switching to a competitor",
        other: "Other",
      },
      detailsTitle: "Billing details",
      limitsTitle: "Plan limits",
      plan: "Plan",
      startDate: "Start date",
      renewAt: "Renews on",
      endsOn: "Ends on",
      trialRemaining: "{days} days remaining in trial",
      noStripeCustomer: "Missing Stripe customer ID",
      success: {
        metaTitle: "Payment success",
        metaDescription: "Your subscription is active.",
        title: "Payment successful",
        description: "Your subscription is now active. Thank you!",
      },
      goDashboard: "Go to dashboard",
      status: {
        trialing: "Trialing",
        trialingDescription: "Trial active",
        active: "Active",
        activeDescription: "Subscription active",
        canceled: "Canceled",
        canceledDescription: "Subscription canceled",
        pastDue: "Past due",
        pastDueDescription: "Payment past due",
        unpaid: "Unpaid",
        unpaidDescription: "Payment failed",
        incomplete: "Incomplete",
        incompleteDescription: "Payment incomplete",
      },
    },
    danger: {
      title: "Delete account",
      description: "Permanently delete your account and all associated data.",
      personalTitle: "Personal account",
      personalDescription: "Delete your personal data and profile.",
      orgTitle: "Organization data",
      orgDescription: "Delete shared organization data.",
      confirmTitle: "Confirm deletion",
      confirmDescription: "This action cannot be undone.",
      confirmText: "Delete account",
      requestedTitle: "Deletion requested",
      requestedDescription: "We have received your request.",
      delete: "Delete account",
    },
    export: {
      title: "Export my data",
      description:
        "Download all your personal data in JSON format (GDPR compliance).",
      dataIncludedTitle: "Included data",
      dataIncludedDescription:
        "Profile, moods, medications, therapy sessions, and exercises.",
      button: "Download my data",
      success: "Your data has been downloaded",
    },
  },
  auth: {
    notSignedIn: "Please sign in to continue.",
    form: {
      name: "Name",
      email: "Email",
      emailPlaceholder: "you@example.com",
      password: "Password",
    },
    signIn: {
      metaTitle: "Sign in to {app}",
      metaDescription: "Access your account to manage testimonials.",
      title: "Sign in",
      description: "Sign in to continue to your dashboard.",
      emailPlaceholder: "you@example.com",
      forgotPassword: "Forgot password?",
      submit: "Sign in",
      magicLinkSubmit: "Send magic link",
      magicLinkPrompt: "Prefer a magic link?",
      magicLinkAction: "Use magic link",
      passwordPrompt: "Prefer a password?",
      passwordAction: "Use password",
      noAccount: "Don't have an account?",
      signUp: "Sign up",
      or: "or",
      lastUsed: "Last used",
      provider: "Continue with {provider}",
    },
    signUp: {
      metaTitle: "Create your {app} account",
      metaDescription: "Start collecting testimonials today.",
      title: "Create your {app} account",
      description: "Get started in minutes with a free account.",
      namePlaceholder: "Your name",
      emailPlaceholder: "you@example.com",
      verifyPassword: "Confirm password",
      passwordMismatch: "Passwords do not match",
      submit: "Create account",
      hasAccount: "Already have an account?",
      signIn: "Sign in",
      validation: {
        nameRequired: "Name is required",
        emailInvalid: "Enter a valid email address",
        passwordMin: "Password must be at least 8 characters",
        verifyPasswordMin: "Confirmation must be at least 8 characters",
        passwordMismatch: "Passwords do not match",
      },
    },
    forgetPassword: {
      metaTitle: "Reset your {app} password",
      metaDescription: "We will send you a reset link.",
      title: "Forgot your password?",
      description: "Enter your email to receive a reset link.",
      submit: "Send reset link",
    },
    resetPassword: {
      metaTitle: "Choose a new password",
      metaDescription: "Set a new password for your account.",
      title: "Set a new password",
      description: "Choose a strong password to secure your account.",
      newPassword: "New password",
      passwordPlaceholder: "At least 8 characters",
      passwordMin: "Password must be at least 8 characters",
      submit: "Update password",
      success: "Password updated",
    },
    confirmDelete: {
      metaTitle: "Confirm account deletion",
      metaDescription: "Confirm deletion of your account.",
      title: "Confirm account deletion",
      description: "This action cannot be undone.",
      confirm: "Delete account",
      invalidToken: "Invalid or expired token",
    },
    newUser: {
      metaTitle: "Welcome to {app}",
      metaDescription: "Your account is ready.",
      title: "You're all set!",
      description: "Your account is ready to use.",
      cta: "Go to dashboard",
    },
    goodbye: {
      metaTitle: "Signed out of {app}",
      metaDescription: "You have been signed out.",
      title: "You're signed out",
      description: "We hope to see you again soon.",
      detailOne: "You can sign back in anytime.",
      detailTwo: "Need a new account? Create one in a few clicks.",
      cta: "Create an account",
    },
    verify: {
      metaTitle: "Verify your email",
      metaDescription: "Check your inbox to verify your email.",
      title: "Check your email",
      description: "We sent you a verification link.",
      checkInbox: "Check your inbox",
      instructions: "Click the link in the email to verify your address.",
      spamHelp: "If you don't see it, check your spam folder.",
      support: "Need help? Contact support.",
    },
    error: {
      message: "Something went wrong",
    },
    logout: "Log out",
  },
  email: {
    section: {
      title: "Stay updated",
      description:
        "Get notified about new features, updates, and best practices for building SaaS products.",
      submit: "Subscribe",
      success: "Thank you for subscribing",
    },
    submit: "Subscribe",
    success: "You have subscribed to our newsletter.",
    placeholder: "Your email",
    invalid: "Enter a valid email address",
    errorDescription: "Try another email address or contact us.",
  },
  form: {
    unsavedWarning: "You have unsaved changes. Are you sure you want to leave?",
  },
  posts: {
    metaTitle: "{app} Blog",
    metaDescription: "Updates, tips, and stories from the team.",
    title: "Blog",
    emptyTitle: "No posts found",
    viewAll: "View all posts",
    back: "Back",
    draft: "Draft",
    publishedBy: "Published {date}",
    readingTime: "Reading time {minutes} min",
    createdBy: "Created by",
    category: {
      title: "Blog posts about {category}",
      metaTitle: "{app} Blog about {category}",
    },
    notFound: {
      title: "404 - Not Found",
      description: "The post you are looking for doesn't exist.",
    },
    error: {
      title: "Error with post",
      description:
        "Sorry, the post you are looking for doesn't work as expected. Please try again later.",
    },
  },
  changelog: {
    metaTitle: "Changelog - {app}",
    metaDescription:
      "Stay up to date with the latest features, improvements, and bug fixes.",
    title: "Changelog",
    description:
      "Stay up to date with the latest features, improvements, and bug fixes.",
    emptyTitle: "No changelog entries yet",
    emptyDescription: "Check back soon for updates.",
    latest: "Latest",
    newUpdate: "New update",
    backToChangelog: "Back to Changelog",
    detail: {
      metaTitle: "{title} - Changelog - {app}",
      metaTitleShort: "{title} - Changelog",
      metaDescription: "Release notes for {title}",
    },
  },
  payment: {
    success: {
      title: "Thank you for your purchase!",
      description:
        "Your payment was successful. You now have full access to premium resources. If you have any questions, we're here to help.",
      cta: "Get started",
    },
    cancel: {
      badge: "Payment failed",
      title: "We couldn't process your payment",
      lineOne: "We encountered an issue processing your payment.",
      lineTwo: "Please check your payment details and try again.",
      lineThree:
        "If the problem persists, don't hesitate to contact us for assistance.",
      lineFour: "We're here to help you resolve this smoothly.",
    },
  },
  about: {
    metaTitle: "About {app}",
    metaDescription:
      "Learn how Moodday helps you track mental health with compassion, privacy, and clinical clarity.",
    hero: {
      kicker: "Our story",
      titlePrefix: "A calmer way to",
      titleHighlight: "track mental health",
      description:
        "Moodday is a supportive journal that helps you understand your mood, treatments, and patterns.",
    },
    mission: {
      title: "Our mission",
      paragraphOne:
        "Make mental health tracking simple, kind, and clinically useful.",
      paragraphTwo:
        "Give people and clinicians a shared, trustworthy picture between visits.",
    },
    vision: {
      title: "Our vision",
      paragraphOne:
        "A world where everyone feels supported between appointments.",
      paragraphTwo:
        "Private data and clear insights that make care more human.",
    },
    values: {
      title: "Our values",
      items: {
        kindness: {
          title: "Kindness first",
          description: "We design for empathy and reduce judgment.",
        },
        privacy: {
          title: "Privacy by default",
          description: "Your data stays yours, with strong encryption.",
        },
        science: {
          title: "Science-led",
          description:
            "We follow evidence-based practices and clinical feedback.",
        },
      },
    },
    stats: {
      activeUsers: "Active users",
      checkins: "Mood check-ins",
      uptime: "Uptime",
      appStoreRating: "App Store rating",
    },
    team: {
      title: "A small team with a big purpose",
      description:
        "We are clinicians, designers, and engineers focused on calm, reliable care tools.",
      joinCta: "Join the team",
      contactCta: "Contact us",
    },
    privacyPromise: {
      title: "Privacy promise",
      description:
        "We never sell your health data. You control what is shared and with whom.",
    },
  },
  contact: {
    metaTitle: "Contact {app}",
    metaDescription:
      "Get in touch with the Moodday team. We're here to help with support, privacy, and product questions.",
    title: "Get in touch",
    description:
      "Have questions about Moodday or need help with your account? We're here to help.",
    cards: {
      email: {
        title: "Email us",
        description: "Reach the support team for product or account questions.",
      },
      response: {
        title: "Response time",
        description: "We reply on business days.",
        value: "Within 24 hours",
      },
      social: {
        title: "Social",
        description: "Follow updates and announcements.",
      },
    },
    form: {
      title: "Send a message",
      subtitle: "We will get back to you as soon as we can.",
      firstName: "First name",
      lastName: "Last name",
      email: "Email",
      subject: "Subject",
      message: "Message",
      submit: "Send message",
      success: "Your message has been sent",
      invalid: "Invalid input",
    },
    faq: {
      title: "Frequently asked questions",
      items: {
        free: {
          question: "Is Moodday free?",
          answer:
            "Yes. You can start on the free plan and upgrade anytime for advanced insights and exports.",
        },
        security: {
          question: "How do you protect my data?",
          answer:
            "We use encryption at rest and in transit, and you control what is shared.",
        },
        export: {
          question: "Can I export my data for my clinician?",
          answer:
            "Yes. You can generate a PDF or JSON export from your dashboard.",
        },
      },
      more: "Still have a question? Contact our team.",
    },
  },
  legal: {
    terms: {
      metaTitle: "{app} - Terms of Service",
      metaDescription: "Terms of service for the Moodday application",
      title: "Terms of Service",
      subtitle:
        "These terms explain how Moodday works and how to use it safely.",
      lastUpdated: "Last updated: January 2026",
      emergency: {
        title: "In case of emergency",
        descriptionPrefix:
          "If you are in distress, contact emergency services at ",
        phone: "988",
        descriptionSuffix: " or reach a local professional.",
      },
      contact: {
        title: "Questions?",
        descriptionPrefix: "Contact us at ",
      },
      sections: {
        service: {
          title: "Purpose of the service",
          content:
            "Moodday is a personal tracking tool to record mood, treatments, and insights.",
          highlight: "Moodday is not a medical device.",
        },
        account: {
          title: "Account and eligibility",
          items: {
            age: "You must be at least 16 years old.",
            accurateInfo: "Provide accurate registration information.",
            credentials: "Keep your credentials confidential.",
            responsibility: "You are responsible for activity on your account.",
          },
        },
        acceptableUse: {
          title: "Acceptable use",
          items: {
            personalTracking: "Use Moodday for personal tracking only.",
            noSharing: "Do not share your credentials.",
            noBypass: "Do not attempt to bypass security measures.",
            respect: "Respect other users and the law.",
          },
        },
        caregiver: {
          title: "Caregiver circle",
          content:
            "You control what is shared. Access can be revoked at any time.",
        },
        ip: {
          title: "Intellectual property",
          content:
            "All content and branding are the property of Moodday or its licensors.",
        },
        liability: {
          title: "Limitation of liability",
          items: {
            decisions: "Moodday is not responsible for medical decisions.",
            interruptions: "Service interruptions may occur.",
            losses: "We are not liable for data loss beyond our control.",
          },
          highlight: "The service is provided “as is”.",
        },
        termination: {
          title: "Termination",
          content: "You can delete your account at any time from settings.",
        },
        law: {
          title: "Governing law",
          content: "These terms are governed by French law.",
        },
      },
      content: `## 1. Purpose

These Terms of Service govern the use of the Moodday application, a digital clinical journal designed for personal mental health tracking.

## 2. Nature of the service

**Moodday is not a medical device.** The application is a personal tracking tool that allows you to:
- Record your daily moods
- Track your medication treatments
- Generate reports for your medical consultations

Moodday does not provide any medical advice, diagnosis, or treatment. In case of distress or emergency, immediately contact a healthcare professional or call 988 (Suicide & Crisis Lifeline).

## 3. Registration and account

To use Moodday, you must:
- Be at least 16 years old
- Provide accurate information during registration
- Maintain the confidentiality of your credentials

You are responsible for all activity under your account.

## 4. Acceptable use

You agree to:
- Use the application only for your personal tracking
- Not share your credentials
- Not attempt to bypass security measures
- Respect the rights of other users

## 5. Caregiver circle

If you invite a loved one to your caregiver circle:
- You remain in control of the data you share
- You can revoke this access at any time
- The caregiver agrees to respect the confidentiality of shared information

## 6. Intellectual property

All application content (texts, graphics, logos, icons) are the property of Moodday SAS or its licensors. Any reproduction is prohibited without authorization.

## 7. Limitation of liability

Moodday cannot be held responsible for:
- Medical decisions made based on application data
- Temporary service interruptions
- Data loss in case of force majeure

The application is provided "as is" without warranty of fitness for any particular medical purpose.

## 8. Termination

You can delete your account at any time from the settings. Moodday may suspend your account in case of Terms violation.

## 9. Modifications

Moodday reserves the right to modify these Terms. You will be notified of significant changes by email or in-app notification.

## 10. Governing law

These Terms are governed by French law. Any dispute will be submitted to the competent courts of Paris.

---

*Last updated: January 2026*

*Contact: hello@moodday.app*`,
    },
    privacy: {
      metaTitle: "{app} - Privacy Policy",
      metaDescription: "How Moodday protects your mental health data",
      title: "Privacy Policy",
      lastUpdated: "Last updated: January 2026",
      intro: {
        prefix: "Your privacy is",
        highlight: "our priority.",
        suffix: " We only collect what is needed to provide the service.",
      },
      sections: {
        data: {
          title: "Data we collect",
          highlight: "We never collect location or contacts.",
          items: {
            account: {
              label: "Account",
              value: "Email, name (optional), encrypted password.",
            },
            daily: {
              label: "Daily tracking",
              value: "Mood, notes, sleep quality.",
            },
            medications: {
              label: "Medications",
              value: "Names, dosages, intake times.",
            },
            therapy: {
              label: "Therapy",
              value: "Session dates and notes (optional).",
            },
          },
        },
        usage: {
          title: "How we use data",
          highlight: "We never sell your data.",
          items: {
            service: {
              label: "Provide the service",
              value: "Track mood and treatments.",
            },
            reports: {
              label: "Generate reports",
              value: "PDF exports for consultations.",
            },
            sharing: {
              label: "Caregiver sharing",
              value: "Only with your consent.",
            },
            improvement: {
              label: "Improve the app",
              value: "Aggregated, anonymized insights.",
            },
          },
        },
        security: {
          title: "Security",
          items: {
            encryption: {
              label: "Encryption",
              value: "AES-256 at rest, TLS in transit.",
            },
            hosting: {
              label: "Hosting",
              value: "EU-based servers.",
            },
            auth: {
              label: "Authentication",
              value: "Strong auth with optional 2FA.",
            },
            audit: {
              label: "Audits",
              value: "Regular security testing.",
            },
          },
        },
        rights: {
          title: "Your rights",
          items: {
            access: {
              label: "Access",
              value: "View all your data anytime.",
            },
            rectify: {
              label: "Rectification",
              value: "Update your information.",
            },
            delete: {
              label: "Erasure",
              value: "Delete your account and data.",
            },
            portability: {
              label: "Portability",
              value: "Export your data in JSON.",
            },
          },
        },
      },
      retention: {
        title: "Data retention",
        items: {
          active: "Data retained while your account is active.",
          afterDeletion: "Deleted within 30 days after account removal.",
          backups: "Backups removed within 90 days.",
        },
      },
      cookies: {
        title: "Cookies",
        description: "We only use essential cookies for the service.",
        note: "No advertising or tracking cookies.",
      },
      contact: {
        title: "Contact",
        descriptionPrefix: "For privacy questions, email ",
      },
      content: `## 1. Introduction

At Moodday, protecting your health data is our absolute priority. This policy explains how we collect, use, and protect your personal information.

## 2. Data collected

### Data you provide us
- **Account**: email, name (optional), encrypted password
- **Daily tracking**: moods, personal notes, sleep quality
- **Medications**: names, dosages, intake times
- **Therapy**: session dates, notes (optional)

### Automatically collected data
- Technical logs (anonymized)
- Aggregated usage data to improve the service

**We NEVER collect**: your geolocation, contacts, messages, or any data from your other applications.

## 3. Use of your data

Your data is used **exclusively** to:
- Provide the personal tracking service
- Generate your PDF reports for consultations
- Share with your authorized caregivers (if you wish)
- Improve the application (aggregated and anonymized data)

**We NEVER sell your data** to third parties, advertisers, or insurers.

## 4. Data sharing

Your data is only shared with:
- **You**: via PDF export and GDPR export
- **Your authorized caregivers**: only the data you choose to share
- **Technical providers**: under strict confidentiality agreement (hosting, email)

## 5. Security

We implement robust security measures:
- **Encryption**: data encrypted at rest (AES-256) and in transit (TLS 1.3)
- **Hosting**: servers exclusively in the European Union
- **Access**: strong authentication, 2FA available
- **Audits**: regular security testing

## 6. Your rights (GDPR)

In accordance with GDPR, you have the following rights:
- **Access**: view all your data at any time
- **Rectification**: modify your information
- **Erasure**: delete your account and all your data
- **Portability**: export your data in JSON format
- **Objection**: refuse certain processing

To exercise these rights: hello@moodday.app

## 7. Data retention

- **Active account**: data retained as long as your account is active
- **After deletion**: data erased within 30 days (unless legal obligation)
- **Backups**: deleted within 90 days

## 8. Cookies

We only use essential cookies:
- Session and authentication
- Preferences (language, theme)

No advertising or tracking cookies. See our [Cookie Policy](/legal/cookies).

## 9. DPO Contact

For any questions regarding your data:
- Email: hello@moodday.app
- Address: Moodday SAS, DPO, Paris, France

## 10. Modifications

We will inform you of any substantial modification to this policy by email.

---

*Last updated: January 2026*

*Moodday SAS - Simplified joint-stock company - France*`,
    },
    cookies: {
      metaTitle: "{app} - Cookie Policy",
      metaDescription: "Our cookie policy and how we use cookies",
      title: "Cookie Policy",
      description: "How Moodday uses cookies and similar technologies",
      lastUpdated: "Last updated: January 2026",
      intro: {
        title: "Cookie overview",
        descriptionPrefix: "Cookies help Moodday",
        descriptionHighlight: "work securely",
        descriptionSuffix: " and remember your preferences.",
      },
      usedTitle: "Cookies we use",
      essentialBadge: "Essential",
      types: {
        auth: {
          name: "Authentication",
          description: "Keep you signed in and secure.",
          examples: "session_token||csrf_token",
        },
        security: {
          name: "Security",
          description: "Protect against abuse and fraud.",
          examples: "rate_limit||device_id",
        },
        preferences: {
          name: "Preferences",
          description: "Remember language and theme.",
          examples: "locale||theme",
        },
      },
      notUsed: {
        title: "Cookies we do not use",
        note: "We do not use advertising or tracking cookies.",
        ads: "Advertising cookies",
        tracking: "Tracking cookies",
        thirdParty: "Third-party marketing cookies",
        social: "Social media tracking cookies",
      },
      manage: {
        title: "Manage cookies",
        description:
          "You can disable cookies in your browser settings at any time.",
        howToLabel: "How to:",
        howToSteps: "Open your browser settings and clear or block cookies.",
      },
      contact: {
        title: "Contact",
        descriptionPrefix: "Questions? Email ",
      },
      sections: [
        {
          title: "What Are Cookies?",
          content:
            "Cookies are small text files stored on your device when you visit a website. They help websites remember your preferences and improve your experience.",
        },
        {
          title: "How We Use Cookies",
          content:
            "Moodday uses strictly necessary cookies to ensure the proper functioning of the application. We use:\n\n• Authentication cookies to keep you logged in\n• Security cookies to protect against fraud\n• Preference cookies to remember your settings (language, theme)",
        },
        {
          title: "No Tracking Cookies",
          content:
            "We do NOT use advertising or tracking cookies. We do not share your data with advertisers or third-party trackers. Your mental health data is private and stays that way.",
        },
        {
          title: "Managing Cookies",
          content:
            "You can manage cookies through your browser settings. Note that disabling essential cookies may affect the functionality of Moodday.",
        },
        {
          title: "Contact Us",
          content:
            "If you have questions about our cookie policy, please contact us at hello@moodday.app",
        },
      ],
    },
  },
  error: {
    notFound: {
      title: "Page not found",
      description: "Sorry, we couldn't find the page you're looking for.",
      explainerTitle: "What might have happened?",
      explainerDescription:
        "The page may have been moved, deleted, or you might have mistyped the URL. If you believe you should have access to this resource, please contact your administrator.",
      cta: "Go back home",
    },
    badRequest: {
      title: "Bad request",
      description:
        "It seems we're experiencing some technical difficulties. Not to worry, our team is working on it. In the meantime, try refreshing the page or visiting us a bit later.",
      cta: "Go back home",
    },
    unauthorized: {
      title: "Unauthorized",
      description:
        "You don't have permission to access this resource. Please sign in or contact your administrator if you believe this is a mistake.",
    },
  },
  offline: {
    metaTitle: "Offline",
    title: "You're offline",
    description: "Some features are unavailable until you reconnect.",
  },
  landing2: {
    nav: {
      features: "Features",
      security: "Security",
      pricing: "Pricing",
      docs: "Docs",
      guides: "Guides",
      signin: "Sign in",
      startTrial: "Start free trial",
    },
    hero: {
      badge: "v2.0 now available",
      title: "Your mental health,",
      titleHighlight: "visualized",
      subtitle:
        "A modern dashboard to track your mood, medications, and patterns. Privacy-first, data-driven.",
      ctaPrimary: "Start for free",
      ctaSecondary: "View features",
      stats: {
        users: "Users",
        uptime: "Uptime",
        rating: "Rating",
      },
    },
    mockup: {
      greeting: "Hello, Marie",
      date: "Wednesday, January 28",
      tabs: {
        mood: "Mood tracking",
        meds: "Medications",
        insights: "Insights",
        reminders: "Reminders",
      },
      moodPanel: {
        title: "Today's mood",
        veryLow: "Very low",
        stable: "Stable",
        excellent: "Excellent",
        average: "7-day avg",
        weeklyDelta: "+12% vs last week",
        lastUpdated: "Last updated",
        lastUpdatedTime: "2 min ago",
        days: {
          mon: "Mon",
          tue: "Tue",
          wed: "Wed",
          thu: "Thu",
          fri: "Fri",
          sat: "Sat",
          sun: "Sun",
        },
        noteLabel: "Add a note",
        notePlaceholder: "How are you feeling?",
        saveButton: "Save",
      },
      medsPanel: {
        title: "Today's medications",
        taken: "Taken",
        pending: "Pending",
        confirm: "Confirm",
        monthlyAdherence: "Monthly adherence",
        progress: "{taken}/{total} taken",
        samples: {
          lithium: "Lithium",
          lamotrigine: "Lamotrigine",
          quetiapine: "Quetiapine",
        },
        morning: "Morning",
        evening: "Evening",
        prn: "As needed",
        takenAt: "Taken at",
      },
      insightsPanel: {
        title: "Your patterns",
        sleepCorrelation: "Sleep correlation",
        sleepDesc: "Better mood with 7h+ sleep",
        weekendPattern: "Weekend pattern",
        weekendDesc: "Mood +15% on Saturdays",
        medicationEffect: "Medication effect",
        medicationDesc: "Peak efficacy at D+14",
        updatedAgo: "Updated 1h ago",
      },
      remindersPanel: {
        title: "Configured reminders",
        moodCheckin: "Mood check-in",
        morningMeds: "Morning meds",
        eveningMeds: "Evening meds",
        daily: "Daily",
        configure: "Configure reminders",
        addReminder: "Add a reminder",
        samples: {
          quetiapine: "Quetiapine 50mg",
          sleepReminder: "Sleep routine",
        },
      },
    },
    features: {
      badge: "Features",
      title: "Everything you need",
      subtitle:
        "A complete suite of tools to take care of your mental health, designed by professionals and patients.",
      items: {
        moodTracking: {
          title: "Smart mood tracking",
          description:
            "Record your mood in seconds. Our algorithm automatically detects your patterns.",
        },
        medications: {
          title: "Medication management",
          description:
            "Smart reminders, adherence tracking, complete history. Never miss a dose again.",
        },
        caregivers: {
          title: "Caregiver circle",
          description:
            "Share your data with your doctor or trusted loved ones. You stay in control.",
        },
        pdfExport: {
          title: "Medical PDF export",
          description:
            "Generate formatted reports for your consultations. Print or share with one click.",
        },
        privacy: {
          title: "Privacy-first",
          description:
            "End-to-end encryption, GDPR compliant. Your data belongs to you.",
        },
        aiInsights: {
          title: "AI Insights",
          description:
            "Our AI analyzes your data to detect patterns invisible to the naked eye.",
        },
      },
    },
    stats: {
      users: "Active users",
      checkins: "Check-ins recorded",
      uptime: "Guaranteed uptime",
      rating: "Average rating",
    },
    security: {
      badge: "Security",
      title: "Your health data deserves the highest level of protection",
      subtitle:
        "We take security seriously. Your trust is our absolute priority.",
      features: {
        encryption: {
          title: "AES-256 encryption",
          description: "Your data is encrypted at rest and in transit",
        },
        zeroKnowledge: {
          title: "Zero-knowledge",
          description: "We cannot read your health data",
        },
        gdpr: {
          title: "GDPR compliant",
          description: "Full compliance with European regulations",
        },
        euHosting: {
          title: "EU hosting",
          description: "Servers exclusively in the European Union",
        },
        secureAuth: {
          title: "Secure auth",
          description: "2FA, OAuth, and biometric authentication",
        },
        audits: {
          title: "Regular audits",
          description: "Quarterly penetration tests",
        },
      },
      badges: {
        ssl: "256-bit SSL",
        rgpd: "GDPR",
        hds: "HDS Ready",
      },
    },
    journey: {
      title: "A day with Moodday",
      subtitle: "Discover how Marie uses Moodday daily",
      mockups: {
        moodLogged: "Mood logged",
        moodLoggedTime: "8:12 AM",
        medReminderTitle: "Medication reminder",
        medReminderName: "Lithium",
        medReminderFrequency: "Daily",
        medReminderNow: "Take now",
        medReminderConfirm: "Confirm",
        medTakenName: "Lithium",
        medTakenTime: "Taken at 12:30 PM",
        insightTitle: "Weekly insight",
        insightDescription: "Mood improved with consistent sleep.",
        weeklyTrend: "+12% vs last week",
        weekdays: {
          mon: "Mon",
          tue: "Tue",
          wed: "Wed",
          thu: "Thu",
          fri: "Fri",
          sat: "Sat",
          sun: "Sun",
        },
      },
      morning: {
        time: "7:00 AM",
        title: "Morning check-in",
        description: "Marie logs her mood in 30 seconds. It's become a reflex.",
      },
      midday: {
        time: "12:30 PM",
        title: "Smart reminder",
        description: "A discrete notification reminds her to take her Lithium.",
      },
      evening: {
        time: "9:00 PM",
        title: "Daily insights",
        description: "She discovers her mood improves when she sleeps well.",
      },
      testimonial: {
        quote:
          "Moodday helped me understand my cycles. I no longer suffer, I understand.",
        author: "Marie L.",
        role: "User for 1 year",
      },
    },
    appComing: {
      title: "Coming soon to mobile!",
      subtitle: "iOS and Android",
      appStore: "App Store",
      googlePlay: "Google Play",
      comingSoon: "Coming soon",
      emailPlaceholder: "your@email.com",
      submitButton: "Notify me",
      submitting: "Subscribing...",
      successTitle: "You're subscribed!",
      successMessage: "We'll keep you informed of the launch.",
      alreadySubscribed: "You're already subscribed.",
      privacyNote: "We respect your privacy. No spam.",
      features: {
        title: "Exclusive mobile features",
        offline: "Offline mode",
        watch: "Apple Watch & Wear OS",
        widgets: "iOS & Android widgets",
        biometric: "Biometric unlock",
      },
    },
    pricing: {
      badge: "Pricing",
      title: "Choose your plan",
      subtitle: "Start for free, upgrade when you're ready.",
      trustBadge: "Secure payments • Cancel anytime",
      toggle: {
        monthly: "Monthly",
        annual: "Annual",
        discount: "-20%",
      },
      perMonth: "/month",
      billedAnnually: "Billed {amount}€/year",
      popular: "Popular",
      plans: {
        free: {
          name: "Free",
          description: "To get started gently",
          cta: "Start for free",
          features: [
            "Unlimited mood tracking",
            "2 medications max",
            "7-day history",
            "Basic journal",
          ],
        },
        pro: {
          name: "Pro",
          description: "For complete tracking",
          cta: "14-day free trial",
          features: [
            "Everything in Free",
            "Unlimited medications",
            "Unlimited history",
            "Advanced AI insights",
            "Caregiver circle (3 people)",
            "Custom PDF export",
            "Email support",
          ],
        },
        ultra: {
          name: "Ultra",
          description: "All advanced features",
          cta: "14-day free trial",
          features: [
            "Everything in Pro",
            "Unlimited caregivers",
            "Priority support",
            "Data export",
            "Advanced features",
          ],
        },
      },
    },
    footer: {
      description:
        "Take care of your mental health with modern tools, secure and respectful of your privacy.",
      links: {
        product: {
          title: "Product",
          features: "Features",
          pricing: "Pricing",
          security: "Security",
          changelog: "Changelog",
        },
        resources: {
          title: "Resources",
          docs: "Documentation",
          blog: "Blog",
          guides: "Guides",
          api: "API",
        },
        company: {
          title: "Company",
          about: "About",
          contact: "Contact",
          careers: "Careers",
        },
        legal: {
          title: "Legal",
          privacy: "Privacy",
          terms: "Terms",
          cookies: "Cookies",
        },
      },
      copyright: "© {year} Moodday. All rights reserved.",
      status: "All systems operational",
    },
  },
  moodday: {
    nav: {
      features: "Features",
      pricing: "Pricing",
      blog: "Blog",
      contact: "Contact",
      getStarted: "Get Started",
      getStartedFree: "Start for free",
    },
    hero: {
      badge: "Compassionate journal",
      title: "Track your",
      titleHighlight: "mental health journey",
      titleSuffix: "with peace of mind",
      subtitle:
        "A digital companion designed with psychiatrists to help you better understand your moods, track your treatments, and prepare your consultations.",
      ctaPrimary: "Start for free",
      ctaSecondary: "Discover features",
      trust: {
        gdpr: "GDPR compliant",
        encrypted: "Encrypted data",
        medicalPdf: "Medical PDF export",
      },
      mockup: {
        greeting: "Hello Marie 👋",
        question: "How are you feeling today?",
        mood: "Mood",
        adherence: "Adherence",
        sleep: "Sleep",
        days: "days",
        quality: "Quality",
        moodToday: "Today's mood",
        veryLow: "Very low",
        stable: "Stable",
        excellent: "Excellent",
        medication: "Lamictal 200mg",
        takenAt: "Taken at 08:00",
        nextSession: "Next session",
        doctor: "Dr. Martin - Monday 2pm",
        vsLastWeek: "vs last week",
      },
    },
    features: {
      badge: "Features",
      title: "Everything you need to",
      titleHighlight: "take care of yourself",
      subtitle:
        "Tools designed with healthcare professionals to support you daily in your mental health journey.",
      items: [
        {
          title: "Smart mood tracking",
          description:
            "Record your mood in seconds with our intuitive scale. Visualize your trends and identify patterns.",
        },
        {
          title: "Treatment management",
          description:
            "Track your medications, dosages, and daily intakes. Get reminders and see correlations with your mood.",
        },
        {
          title: "Sleep journal",
          description:
            "Log your sleep hours and quality. Understand the impact of rest on your mental well-being.",
        },
        {
          title: "Analytics & trends",
          description:
            "Visualize your data on clear charts. Identify factors that influence your mental state.",
        },
        {
          title: "Medical PDF export",
          description:
            "Generate a comprehensive report for your consultations. Facilitate communication with your psychiatrist or therapist.",
        },
        {
          title: "Caregiver circle",
          description:
            "Invite a trusted loved one to follow your journey. Share only what you wish to share.",
        },
        {
          title: "Zero guilt",
          description:
            "No streaks, no aggressive gamification. Your well-being comes first, at your own pace.",
        },
        {
          title: "Total privacy",
          description:
            "Your data is encrypted and belongs to you. Export or delete everything anytime (GDPR).",
        },
      ],
    },
    roles: {
      badge: "For whom?",
      title: "Whether you are",
      titleHighlight: "patient or caregiver",
      subtitle:
        "Moodday adapts to your situation to best support you on your journey.",
      patient: {
        tab: "Patient",
        title: "I am a patient",
        subtitle: "I want to track my mental health journey",
        cta: "Create my patient account",
        features: [
          {
            title: "Daily tracking",
            description: "Record mood, sleep, and treatments in 30 seconds",
          },
          {
            title: "Consultation export",
            description: "Generate a complete PDF for your psychiatrist",
          },
          {
            title: "No pressure",
            description: "No streaks or guilt-inducing notifications",
          },
          {
            title: "Private data",
            description: "End-to-end encryption, GDPR compliant",
          },
        ],
      },
      caregiver: {
        tab: "Caregiver",
        title: "I am a caregiver",
        subtitle: "I want to support a loved one",
        cta: "Join a caregiver circle",
        features: [
          {
            title: "Optional alerts",
            description: "Get notified only if your loved one wishes to share",
          },
          {
            title: "Overview",
            description: "View trends shared by your loved one",
          },
          {
            title: "Medication tracking",
            description: "Help manage treatments if authorized",
          },
          {
            title: "Respect autonomy",
            description: "The patient controls what they share with you",
          },
        ],
      },
      trust: {
        designedWith: "Designed with psychiatrists",
        activeUsers: "+5000 active users",
        rating: "4.8/5 rating on App Store",
      },
    },
    pricing: {
      badge: "Pricing",
      title: "Choose the plan",
      titleHighlight: "that suits you",
      subtitle: "Start for free, upgrade as needed. Cancel anytime.",
      monthly: "Monthly",
      yearly: "Yearly",
      discount: "-33%",
      perMonth: "/month",
      perYear: "/year",
      equivalent: "That's {price}/month",
      mostPopular: "Most popular",
      trustBadge:
        "Secure payment via Stripe. Easy cancellation, no commitment.",
      plans: {
        free: {
          name: "Free",
          description: "To start your journey",
          cta: "Start for free",
          features: [
            "Daily mood tracking",
            "Unlimited journal",
            "30-day history",
            "1 medication tracked",
            "Basic export",
          ],
        },
        premium: {
          name: "Premium",
          description: "For complete tracking",
          cta: "14-day free trial",
          features: [
            "Everything in Free",
            "Unlimited history",
            "Unlimited medications",
            "Advanced analytics",
            "Medical PDF export",
            "Custom reminders",
            "Circle of 2 caregivers",
            "Priority support",
          ],
        },
        family: {
          name: "Family",
          description: "For you and your loved ones",
          cta: "Contact team",
          features: [
            "Everything in Premium",
            "Up to 5 accounts",
            "Expanded caregiver circle",
            "Family dashboard",
            "Shared reports",
            "Dedicated support",
          ],
        },
      },
    },
    faq: {
      badge: "FAQ",
      title: "You have questions?",
      subtitle: "Find answers to the most common questions about Moodday.",
      contactPrompt: "Can't find the answer?",
      contactLink: "Contact us",
      contactSubtext: "Our team will respond as soon as possible.",
      items: [
        {
          question: "Does Moodday replace medical care?",
          answer:
            "No, Moodday is a personal tracking tool that complements your medical care. It helps you communicate better with your healthcare providers by giving them objective data about your journey. In case of crisis, always contact a healthcare professional or call your local crisis line.",
        },
        {
          question: "Is my data confidential?",
          answer:
            "Absolutely. Your data is end-to-end encrypted and stored on secure servers in Europe. We are GDPR compliant and you can export or delete your data at any time. We never sell your data to third parties.",
        },
        {
          question: "Can I share my data with my psychiatrist?",
          answer:
            "Yes, you can generate a comprehensive PDF report of your history (mood, medications, sleep) to share during your consultations. You control exactly what is included in the export.",
        },
        {
          question: "How does the caregiver circle work?",
          answer:
            "You can invite a trusted loved one to join your caregiver circle. You decide exactly what they can see (general trends, alerts in case of decline...). The caregiver never sees your personal notes without your explicit permission.",
        },
        {
          question: "Are there notifications or streaks?",
          answer:
            "We deliberately eliminated all forms of guilt-inducing gamification. No streaks, no points, no aggressive notifications. You receive a gentle, configurable reminder, and if you miss a day, it's okay. Your well-being comes before statistics.",
        },
        {
          question: "Can I use Moodday offline?",
          answer:
            "Yes, the app works offline for daily entries. Your data syncs automatically when you're back online.",
        },
        {
          question: "How do I cancel my subscription?",
          answer:
            "You can cancel anytime from your account settings, with no fees or justification needed. Your data remains accessible in read-only mode for 30 days after cancellation.",
        },
      ],
    },
    cta: {
      title: "Ready to take care of",
      titleHighlight: "your mental health",
      titleSuffix: "?",
      subtitle:
        "Join thousands of people who use Moodday to better understand their journey and communicate with their caregivers.",
      ctaPrimary: "Start for free",
      ctaSecondary: "Contact team",
      trust: "14-day free trial • No credit card • Easy cancellation",
      trustBadges: {
        freeTrial: "14-day free trial",
        noCreditCard: "No credit card",
        easyCancellation: "Easy cancellation",
      },
    },
    footer: {
      emergency: {
        title: "Need urgent help?",
        phone: "988 - Suicide & Crisis Lifeline",
        subtext: "Free and confidential, 24/7",
      },
      description:
        "Your digital companion to track your mental health journey. Designed with healthcare professionals.",
      disclaimer:
        "Moodday is a tracking tool, not a medical device. If in distress, contact a healthcare professional.",
      social: {
        twitter: "Twitter",
        linkedin: "LinkedIn",
        instagram: "Instagram",
      },
      sections: {
        product: {
          title: "Product",
          features: "Features",
          pricing: "Pricing",
          security: "Security",
          faq: "FAQ",
        },
        resources: {
          title: "Resources",
          blog: "Blog",
          guides: "Guides",
          help: "Help",
          contact: "Contact",
        },
        legal: {
          title: "Legal",
          terms: "Terms",
          privacy: "Privacy",
          gdpr: "GDPR",
          cookies: "Cookies",
        },
      },
      copyright: "© {year} Moodday SAS. All rights reserved.",
    },
    newsletter: {
      title: "Stay informed",
      subtitle: "Receive tips for your mental well-being and Moodday updates.",
      placeholder: "Your email",
      cta: "Subscribe",
      success: "Thanks for subscribing!",
      alreadySubscribed: "This email is already subscribed.",
      subscribed: "You're subscribed!",
      subscribedSubtitle: "You'll receive our tips soon.",
      error: "An error occurred. Please try again.",
      privacy: "We respect your privacy. Easy unsubscribe.",
    },
    mobileApp: {
      badge: "Coming soon",
      title: "Mobile app",
      appStore: "App Store",
      googlePlay: "Google Play",
      subtitle: "Take Moodday everywhere with you",
      comingSoon: "Soon",
      features: {
        offline: "Offline mode",
        notifications: "Reminders",
        sync: "Auto sync",
      },
    },
  },
  guides: {
    metaTitle: "Guides - {app}",
    metaDescription:
      "Practical guides to help you get the most out of Moodday for your mental health journey.",
    title: "Practical Guides",
    description:
      "Resources and tutorials to help you use Moodday effectively and take care of your mental health.",
    categories: {
      start: {
        title: "Getting Started",
        description: "Start using Moodday in minutes",
      },
      features: {
        title: "Features",
        description: "Master all the app features",
      },
      sharing: {
        title: "Sharing & Security",
        description: "Share your data with confidence",
      },
    },
    cta: {
      title: "Can't find what you're looking for?",
      description: "Our team is here to help you get the most out of Moodday",
      button: "Contact us",
    },
    readMore: "Read more",
    items: {
      gettingStarted: {
        title: "Getting Started",
        description:
          "Learn how to set up your account and start tracking your mood.",
        content: `## Create your account

1. **Sign up** - Go to the registration page and create your account with your email or sign in via Google/GitHub.

2. **Verification** - Confirm your email by clicking the link sent to your inbox.

## Customize your profile

- Access **Settings** from the menu
- Add your photo and personal information
- Configure your notification preferences

## Record your first mood

1. From the dashboard, click on **"My mood"**
2. Use the slider to indicate your mood level (0-10)
3. Add an optional note to describe how you feel
4. Click **"Save"**

Congratulations! You've just taken your first step toward better understanding your mental health.`,
      },
      profile: {
        title: "Configure your profile",
        description:
          "Customize your experience with your preferences and goals.",
        content: `## Notifications

- **Daily reminder** - Set the time you want to receive a reminder to log your mood
- **Medication reminders** - Set alerts so you never miss a dose

## Display preferences

- **Chart period** - Choose the default period (7, 30 or 90 days)
- **Theme** - Select light, dark or auto mode

## Privacy settings

- Manage who can see your data if you use the caregiver circle
- Control the information shared in your PDF exports`,
      },
      moodTracking: {
        title: "Mood Tracking",
        description:
          "Learn how to record and analyze your daily mood variations.",
        content: `## Record your mood

1. **The 0-10 slider** - Use the intuitive scale to indicate your mood level
   - 0-3: Low mood
   - 4-6: Neutral mood
   - 7-10: Good mood

2. **Notes** - Add context to your entries to better understand your patterns

## Analyze your trends

- View your **charts** over 7, 30 or 90 days
- Identify **recurring patterns** (days of the week, events)
- Observe **correlations** with your medications and sleep

## Edit or delete an entry

- Click on an entry in the history
- Use the **"Edit"** button to adjust the mood or note
- Use **"Delete"** if you want to remove an entry`,
      },
      medications: {
        title: "Managing Medications",
        description:
          "How to add, track, and get reminders for your medications.",
        content: `## Add a medication

1. Go to **"Medications"** from the menu
2. Click **"Add medication"**
3. Enter the name, dosage and frequency
4. Enable the **PRN** option if you also take it "as needed"

## Record your intakes

- Each day, mark your medications as taken
- For PRN, use the **"Log"** button and add an optional reason
- View your intake history in the medication details

## Dosage history

- When you change dosage, the system keeps a history
- Visualize the impact of changes on your mood

## Archive a medication

- When you stop a treatment, archive it rather than deleting it
- The history is preserved for your medical consultations`,
      },
      reports: {
        title: "Reports and Statistics",
        description: "Generate PDF reports for your medical consultations.",
        content: `## Generate a PDF export

1. Go to **"Export"** from the Tools menu
2. Select the period (2 weeks, 1 month, 3 months or custom)
3. Click **"Preview"** to see the content
4. Download the PDF with **"Download PDF"**

## Report content

- **Mood chart** over the selected period
- **Statistics**: average, trend, number of entries
- **Medications**: list of treatments and adherence
- **Therapy sessions** recorded

## Share with your doctor

- Print the PDF for your consultation
- Or send it by email to your healthcare professional

## GDPR Export

- In **Account > Export my data**, download all your data in JSON format
- Compliant with the General Data Protection Regulation`,
      },
      caregivers: {
        title: "Caregiver Circle",
        description: "Share your progress with trusted loved ones.",
        content: `## Invite a caregiver

1. Access **"Caregiver"** from the menu
2. Enter the email of the person to invite
3. Define permissions (read-only or interactions)

## What your caregivers can see

- **General mood trends** (not detailed notes)
- **Medication adherence** (percentage)
- **Alerts** if you don't log in for several days

## What remains private

- Your personal notes
- Details of your therapy sessions
- The content of your daily entries

## Manage access

- Revoke a caregiver's access at any time
- Modify permissions as needed
- Receive a notification when a caregiver views your data`,
      },
      privacy: {
        title: "Privacy & Security",
        description: "How we protect your sensitive health data.",
      },
    },
  },
  careers: {
    metaTitle: "Careers - {app}",
    metaDescription:
      "Join the Moodday team and help us build tools that improve mental health.",
    title: "Join Our Team",
    description:
      "We're building tools that help people take care of their mental health. Want to make a difference?",
    values: {
      title: "Our Values",
      items: [
        {
          title: "Empathy First",
          description:
            "We design for real people with real challenges. Compassion guides everything we do.",
        },
        {
          title: "Remote & Flexible",
          description:
            "Work from anywhere. We trust you to manage your time and deliver great work.",
        },
        {
          title: "Impact Driven",
          description:
            "Every feature we build aims to genuinely improve someone's mental health journey.",
        },
      ],
    },
    openPositions: {
      title: "No Open Positions",
      description:
        "We don't have any open positions right now, but we're always looking for talented people. Send us a spontaneous application!",
      cta: "Contact Us",
    },
  },
};

export default en;
