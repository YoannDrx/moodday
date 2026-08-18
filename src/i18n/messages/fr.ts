import type en from "./en";

const fr: typeof en = {
  meta: {
    title: "Moodday",
    description:
      "Compagnon de suivi personnel pour comprendre vos journées, suivre vos traitements déclarés et préparer vos consultations, sans diagnostic.",
  },
  language: {
    title: "Langue",
    toggleLabel: "Changer de langue",
    current: "Langue actuelle",
    fr: "Français",
    en: "Anglais",
  },
  nav: {
    docs: "Documentation",
    guides: "Guides",
    about: "À propos",
    contact: "Contact",
    features: "Fonctionnalités",
    pricing: "Tarifs",
    blog: "Blog",
    menu: "Menu",
    toggleMenu: "Basculer le menu de navigation",
    logoAlt: "Logo de l'application",
    analytics: "Analyses",
    dashboard: "Tableau de bord",
    account: "Compte",
    app: "Application",
    backToSite: "Retour au site",
  },
  footer: {
    description:
      "Journal personnel et confidentiel pour suivre votre santé mentale.",
    product: "Produit",
    blog: "Blog",
    documentation: "Documentation",
    guides: "Guides",
    dashboard: "Tableau de bord",
    account: "Compte",
    company: "Entreprise",
    about: "À propos",
    contact: "Contact",
    legal: "Légal",
    terms: "Conditions",
    privacy: "Confidentialité",
    rights: "© {year} {company}. Tous droits réservés.",
  },
  actions: {
    close: "Fermer",
    toggleTheme: "Changer de thème",
    cancel: "Annuler",
    tryAgain: "Réessayer",
    save: "Enregistrer",
    saving: "Enregistrement...",
    edit: "Modifier",
    back: "Retour",
    previous: "Précédent",
    continue: "Continuer",
    finish: "Terminer",
  },
  common: {
    error: "Une erreur est survenue",
    saving: "Enregistrement...",
    unexpectedError: "Une erreur inattendue est survenue.",
    redirecting: "Redirection...",
    selectPlaceholder: "Sélectionnez une option",
    actionFailed: "Échec de l'action. Veuillez réessayer.",
    me: "Moi",
    offlineMode:
      "Mode hors ligne. Les changements seront synchronisés au retour du réseau.",
    pendingSync: "{count} en attente de synchronisation",
    offlineStorageFull:
      "Le stockage hors ligne est plein. Reconnectez-vous pour synchroniser, puis réessayez. Vous pouvez contrôler la file dans les paramètres.",
  },
  medication: {
    add: {
      title: "Ajouter un médicament",
      description: "Ajoute un nouveau médicament à suivre",
      submit: "Ajouter le médicament",
      success: "Médicament ajouté !",
    },
    edit: {
      title: "Modifier le médicament",
      submit: "Enregistrer",
      success: "Médicament modifié !",
    },
    form: {
      name: "Nom du médicament",
      namePlaceholder: "ex: Sertraline",
      dosage: "Dosage",
      dosagePlaceholder: "ex: 50mg",
      dosageHint: "Entre le dosage tel qu'indiqué sur ton ordonnance",
      frequency: "Fréquence",
      isPRN: "Aussi pris si besoin (PRN)",
      isPRNHint:
        "Coche si tu prends parfois ce médicament en dehors du planning",
      scheduleTitle: "Planning des prises",
      scheduleHint:
        "Utilisé pour la checklist du jour et les rappels de médicaments.",
      doseTime: "Heure de prise",
      weeklyDay: "Jour hebdomadaire",
      lifecycleTitle: "Période du traitement",
      lifecycleHint:
        "Ces dates servent aux statistiques. Moodday ne recommande aucun changement de traitement.",
      startDate: "Date de début",
      endDate: "Date de fin (facultative)",
      inventoryTitle: "Stock facultatif",
      inventoryHint:
        "Le stock n’est déduit lors d’une prise que si les unités par prise sont renseignées.",
      stockQuantity: "Stock actuel",
      unitsPerDose: "Unités par prise",
      lowStockThreshold: "Seuil de stock bas",
      changeReason: "Motif du changement (facultatif)",
      changeReasonHint: "Ex. mise à jour saisie après une consultation",
    },
    weekDay: {
      sunday: "Dimanche",
      monday: "Lundi",
      tuesday: "Mardi",
      wednesday: "Mercredi",
      thursday: "Jeudi",
      friday: "Vendredi",
      saturday: "Samedi",
    },
    frequency: {
      daily: "Une fois par jour",
      twiceDaily: "Deux fois par jour",
      weekly: "Une fois par semaine",
      prn: "Si besoin (PRN)",
    },
    frequencyShort: {
      daily: "Quotidien",
      twiceDaily: "2x/jour",
      weekly: "Hebdomadaire",
      prn: "PRN",
    },
    list: {
      title: "Mes médicaments",
      emptyTitle: "Aucun médicament pour l'instant",
      empty:
        "Pas encore de médicaments. Ajoute ton premier médicament pour commencer !",
      addNew: "Ajouter un médicament",
      myTreatments: "Mes traitements",
      activeCount: "{count} actifs",
      archived: "Médicaments archivés",
      showArchived: "Voir archivés",
      hideArchived: "Masquer archivés",
      takenToday: "Pris aujourd'hui",
      notTaken: "Pas encore pris",
      doseProgress: "{taken}/{total} pris",
      noDoseToday: "Rien aujourd'hui",
    },
    archive: {
      title: "Archiver ce médicament ?",
      description:
        "Le médicament sera masqué de ta liste active mais l'historique sera conservé.",
      confirm: "Archiver",
      success: "Médicament archivé",
    },
    unarchive: {
      success: "Médicament restauré",
    },
    prn: {
      badge: "PRN",
      section: "Si besoin",
      also: "Également si nécessaire",
      logged: "Prise PRN enregistrée !",
      takenToday: "{count}x aujourd'hui",
      takenTodaySingular: "{count}x aujourd'hui",
      takenTodayPlural: "{count}x aujourd'hui",
      logButton: "Prendre",
      logTitle: "Prendre {name}",
      logDescription:
        "Enregistre la prise de ce médicament. Ajoute une raison optionnelle.",
      reasonPlaceholder: "Pourquoi l'as-tu pris ? (optionnel)",
      confirm: "Enregistrer la prise",
      todayHistory: "Prises du jour",
    },
    detail: {
      title: "Détails du médicament",
      back: "Retour à la liste",
      edit: "Modifier",
      restore: "Restaurer",
      archived: "Archivé",
      dosageHistory: "Historique des dosages",
      previousDosage: "Précédent",
      inventory: "Stock et historique",
      currentStock: "Stock actuel : {count}",
      lowStock: "Seuil bas atteint",
      inventoryNotConfigured: "Stock non configuré",
      treatmentPeriod: "Période : {start} → {end}",
      ongoing: "en cours",
      inventoryEvent: "Variation : {delta}",
      intakeRevision: "Prise {action}",
      corrected: "corrigée",
      cancelled: "annulée",
      inventoryDelta: "Variation de stock",
      inventoryReason: "Motif",
      refill: "Réapprovisionnement",
      correction: "Correction",
      manual: "Ajustement manuel",
      applyInventory: "Appliquer",
      inventoryUpdated: "Stock mis à jour",
      inventoryDeltaInvalid: "Saisissez une variation différente de zéro",
      scheduleHistory: "Historique du planning",
    },
    dosageHistory: {
      title: "Historique des dosages",
    },
    intake: {
      logged: "Médicament pris !",
      loggedOffline: "Prise enregistrée hors ligne",
      skipped: "Médicament sauté",
      skippedOffline: "Dose sautée enregistrée hors ligne",
      undone: "Prise annulée",
      undo: "Annuler",
      skip: "Sauter aujourd'hui",
      skipDose: "Sauter la dose",
    },
    status: {
      pending: "En attente",
      taken: "Pris",
      skipped: "Sauté",
    },
    doseSlot: {
      once: "Dose du jour",
      morning: "Matin",
      evening: "Soir",
      weekly: "Dose hebdomadaire",
    },
    today: {
      title: "Médicaments du jour",
      subtitle: "Marque tes médicaments comme pris",
      emptyTitle: "Rien de prévu aujourd'hui",
      empty: "Pas de médicaments réguliers. Ajoute-en un pour commencer !",
      allDone: "Tout est pris pour aujourd'hui !",
      allDoneSubtext: "Bravo, tout est à jour.",
      progress: "{taken} sur {total} pris",
      remainingSingular: "{count} restant",
      remainingPlural: "{count} restants",
      backToList: "Retour à la liste",
      addMedication: "Ajouter un médicament",
      regularTitle: "Médicaments réguliers",
    },
    quickActions: {
      today: "Aujourd'hui",
      history: "Historique",
    },
    stats: {
      treatments: "Traitements",
      today: "Aujourd'hui",
      adherence: "Observance",
    },
    validation: {
      nameRequired: "Le nom du médicament est requis",
      dosageRequired: "Le dosage est requis",
    },
  },
  mood: {
    entry: {
      title: "Comment te sens-tu ?",
      editTitle: "Modifier ton humeur",
      notePlaceholder: "Ajoute une note (optionnel)...",
      save: "Enregistrer mon humeur",
      saved: "Humeur enregistrée !",
      savedAt: "Enregistré à {time}",
      addNew: "Ajouter une nouvelle entrée",
      offlineSaved: "Enregistré hors ligne",
      offlineEditUnavailable: "La modification est indisponible hors ligne.",
      offlineDeleteUnavailable: "La suppression est indisponible hors ligne.",
      update: "Modifier",
      updated: "Humeur modifiée !",
      delete: "Supprimer",
      deleted: "Entrée supprimée",
      undo: "Annuler",
      undone: "Check-in annulé",
      deleteTitle: "Supprimer cette entrée ?",
      deleteDescription:
        "Cette action est irréversible. Ton entrée d'humeur sera définitivement supprimée.",
      deleteConfirm: "Oui, supprimer",
    },
    journal: {
      title: "Check-in quotidien",
      stepLabel: "Étape {current} sur {total}",
      saved: "Journal enregistré !",
      saveError: "Impossible d'enregistrer votre entrée.",
      insight: {
        title: "Analyse",
        titleAi: "Analyse IA",
        includeNotes: "Inclure cette note dans le bilan",
        includeNotesDescription:
          "Désactivé par défaut et utilisé uniquement si vous avez autorisé les notes dans Confidentialité.",
        loading: "Génération de l'analyse...",
        fallback: "Continuez le suivi pour voir des analyses ici.",
        localNotice: "Les analyses sont générées localement hors ligne.",
        aiDisclaimer:
          "Généré par IA. Ce bilan peut contenir des erreurs, ne pose pas de diagnostic et ne constitue pas un avis médical.",
        generatedAt: "Généré le {date}",
        dataUsed: "Données utilisées : {fields}.",
        disableAi: "Désactiver l’IA",
        privacy: "Confidentialité",
        metrics: {
          mood: "humeur",
          energy: "énergie",
          anxiety: "anxiété",
          sleepHours: "durée de sommeil",
          sleepQuality: "qualité du sommeil",
          tags: "tags",
          journalNotes: "note de journal (avec accord séparé)",
        },
      },
      step1: {
        title: "Comment vous sentez-vous ?",
        subtitle: "Évaluez votre humeur, votre énergie et votre anxiété.",
        moodLabel: "Humeur",
        moodScale: {
          low: "Basse",
          mid: "Moyenne",
          high: "Haute",
        },
        energyLabel: "Énergie",
        energyScale: {
          low: "Faible",
          mid: "Modérée",
          high: "Élevée",
        },
        anxietyLabel: "Anxiété",
        anxietyScale: {
          low: "Faible",
          mid: "Modérée",
          high: "Élevée",
        },
      },
      step2: {
        title: "Sommeil",
        subtitle: "Comment avez-vous dormi la nuit dernière ?",
        durationLabel: "Heures de sommeil",
        qualityLabel: "Qualité du sommeil",
        disturbancesLabel: "Perturbations",
      },
      step3: {
        title: "Médicaments",
        subtitle: "Marquez vos médicaments et vos effets secondaires.",
        markTaken: "Marquer comme pris",
        addOneOff: "Ajouter un médicament ponctuel",
        noMeds: "Aucun médicament configuré",
        sideEffectsTitle: "Effets secondaires",
        sideEffectsPlaceholder: "Effets secondaires aujourd'hui ? (optionnel)",
      },
      step4: {
        title: "Symptômes et événements",
        subtitle: "Quelque chose de notable aujourd'hui ?",
        symptomsLabel: "Symptômes",
        eventsLabel: "Événements",
      },
      step5: {
        title: "Notes",
        subtitle: "Autre chose à retenir ?",
        placeholder: "Écrivez une note courte...",
      },
    },
    page: {
      description: "Notez votre humeur et vos entrées de journal.",
    },
    slider: {
      aria: "Curseur d'humeur",
      emojiAria: "Emoji d'humeur {value}",
      currentValueAria: "Valeur d'humeur actuelle {value}",
    },
    history: {
      title: "Historique des humeurs",
      empty: "Pas encore d'entrées. Commence à suivre ton humeur !",
      filter: {
        all: "Tout",
        week: "7 derniers jours",
        month: "30 derniers jours",
        quarter: "90 derniers jours",
      },
    },
  },
  therapy: {
    add: {
      title: "Nouvelle séance de thérapie",
      description: "Note tes observations et réflexions de séance",
      submit: "Enregistrer la séance",
      success: "Séance enregistrée ! Prends soin de toi 💙",
      offlineSaved:
        "Enregistré hors ligne. La synchronisation se fera quand vous serez de retour en ligne.",
    },
    edit: {
      title: "Modifier la séance",
      description: "Mettez à jour vos notes et détails de séance",
      submit: "Enregistrer",
      success: "Séance modifiée !",
    },
    form: {
      date: "Date de la séance",
      selectDate: "Sélectionne une date",
      notes: "Notes de séance",
      notesPlaceholder:
        "De quoi avez-vous parlé ? Comment te sentais-tu ? Des prises de conscience ?",
      notesHint: "Écris librement, c'est ton espace privé",
      benefitRating: "Cette séance t'a-t-elle été bénéfique ?",
      benefitRatingHint: "Optionnel - note de 1 à 5 étoiles",
    },
    list: {
      title: "Séances de thérapie",
      mySessions: "Mes séances",
      sessionCount: "{count} séances",
      empty: "Pas encore de séances. Note ta première séance de thérapie !",
      addNew: "Ajouter une séance",
    },
    delete: {
      title: "Supprimer cette séance ?",
      description: "Cette action est irréversible.",
      confirm: "Oui, supprimer",
      success: "Séance supprimée",
    },
    validation: {
      notesRequired: "Les notes sont requises",
    },
  },
  exercise: {
    add: {
      title: "Nouvel exercice",
      description: "Ajoute un exercice de bien-être à suivre",
      submit: "Ajouter l'exercice",
      success: "Exercice ajouté !",
    },
    edit: {
      title: "Modifier l'exercice",
      description: "Mettez à jour les détails de votre exercice bien-être",
      submit: "Enregistrer",
      success: "Exercice modifié !",
    },
    form: {
      name: "Nom de l'exercice",
      namePlaceholder: "ex: Respiration profonde, Méditation, Marche",
      description: "Description (optionnel)",
      descriptionPlaceholder: "Comment faire cet exercice...",
      descriptionHint: "Optionnel - décris comment réaliser cet exercice",
    },
    list: {
      title: "Mes exercices",
      myExercises: "Mes exercices",
      activeCount: "{count} actifs",
      empty:
        "Pas encore d'exercices. Ajoute ton premier exercice de bien-être !",
      addNew: "Ajouter un exercice",
      archived: "Exercices archivés",
      showArchived: "Voir archivés",
      hideArchived: "Masquer archivés",
    },
    log: {
      logged: "Exercice terminé ! 🎉",
      undone: "Log annulé",
      undo: "Annuler",
      button: "Fait",
      todayCount: "{count}x aujourd'hui",
    },
    archive: {
      title: "Archiver cet exercice ?",
      description: "L'exercice sera masqué mais l'historique conservé.",
      confirm: "Archiver",
      success: "Exercice archivé",
    },
    unarchive: {
      success: "Exercice restauré",
    },
    validation: {
      nameRequired: "Le nom de l'exercice est requis",
    },
  },
  insights: {
    title: "Tableau de bord",
    chart: {
      title: "Humeur sur 30 jours",
      noData: "Pas encore de données. Commence à tracker ton humeur !",
      mood: "Humeur",
      dosageChange: "Changement de dosage",
    },
    dashboard: {
      mood: {
        title: "Humeur",
        average: "Moyenne semaine",
        noData: "Pas de données",
      },
      medications: {
        title: "Médicaments",
        taken: "{count} pris aujourd'hui",
        adherence: "{percent}% d'observance",
        noMeds: "Pas de médicaments",
      },
      therapy: {
        title: "Thérapie",
        lastSession: "Dernière séance",
        sessions: "{count} séances ce mois",
        noSessions: "Pas encore de séances",
      },
      exercises: {
        title: "Exercices",
        completed: "{count} cette semaine",
        noExercises: "Pas d'exercices",
      },
    },
    patterns: {
      title: "Analyses",
      noInsights: "Continue à tracker pour voir des insights !",
      mood: {
        avg: {
          high: "Votre humeur moyenne est de {value}/10. Continuez sur votre lancée.",
          mid: "Votre humeur moyenne est de {value}/10. Stable et régulière.",
          low: "Votre humeur moyenne est de {value}/10. Envisagez un soutien supplémentaire.",
        },
        weekendHigher: "Votre humeur a tendance à être meilleure le week-end.",
        weekdayHigher: "Votre humeur a tendance à être meilleure en semaine.",
      },
      medication: {
        high: "L'observance des médicaments est de {value} %. Très bonne régularité.",
        mid: "L'observance des médicaments est de {value} %. Continuez à créer l'habitude.",
        low: "L'observance des médicaments est de {value} %. Des rappels pourraient aider.",
      },
      therapy: {
        improved: "Les séances de thérapie ont augmenté à {count} ce mois-ci.",
        steady:
          "Les séances de thérapie sont restées stables à {count} ce mois-ci.",
        lower: "Les séances de thérapie ont diminué à {count} ce mois-ci.",
      },
      exercise: {
        completed: "{count} exercices terminés ce mois-ci.",
      },
    },
    streak: {
      subtitle: {
        long: "Série incroyable : {count} jours !",
        weeks: "{weeks} semaines d'affilée. Continuez !",
        week: "Une semaine complète ! Bravo.",
        goodStart: "Bon départ : {count} jours d'affilée.",
        zero: "Commencez votre première série aujourd'hui.",
        one: "{count} jour enregistré. Continuez !",
        few: "{count} jours d'affilée. Beau progrès !",
      },
    },
  },
  dashboard: {
    greeting: "Bonjour {name}",
    defaultName: "Utilisateur",
    today: "Nous sommes le {date}",
    quickMood: {
      title: "Check-in rapide",
      subtitle: "Notez votre humeur et votre énergie en moins de 30 secondes",
      badge: "Moins de 30 s",
      save: "Enregistrer",
      energyLabel: "Niveau d'énergie",
      energyValue: "{value}/10",
      addDetails: "Ajouter des détails au journal",
    },
    trend: {
      title: "Tendance de l'humeur",
      range7d: "7 derniers jours",
    },
    medications: {
      title: "Médicaments d'aujourd'hui",
      history: "Historique",
      empty: "Aucun médicament prévu pour aujourd'hui.",
    },
    caregivers: {
      title: "Cercle d'aidants",
      empty: "Aucun aidant pour le moment",
      defaultName: "Aidant",
      statusActive: "Actif",
      statusPending: "En attente",
      open: "Ouvrir le cercle d'aidants",
    },
    todayFocus: {
      moodDone: "Check-in fait",
      moodOpen: "Faire le check-in",
      medsDone: "Tout est à jour",
      medsRemaining: "{count} restant(s)",
      exercisesCount: "{count} cette semaine",
      therapyCount: "{count} ce mois-ci",
    },
    sleep: {
      title: "Sommeil",
      averageHours: "{hours}h en moyenne",
      qualityLabel: "Qualité",
      qualityPoor: "Mauvaise",
      qualityAverage: "Moyenne",
      qualityExcellent: "Excellente",
      energyLabel: "Énergie",
      avgMoodLabel: "Humeur moy.",
      noData: "Aucune donnée de sommeil pour l'instant.",
    },
    insights: {
      title: "Analyses",
      emptyTitle: "Pas encore assez de données",
      emptyDescription:
        "Les tendances apparaîtront ici uniquement lorsqu’elles pourront être calculées à partir de vos propres entrées.",
      viewMore: "Voir plus d'analyses",
    },
  },
  streak: {
    title: "Votre série",
    daySingular: "jour",
    dayPlural: "jours",
    weekProgress: "{count} sur 7 jours",
  },
  breathing: {
    phases: {
      inhale: "Inspirer",
      hold: "Retenir",
      exhale: "Expirer",
      rest: "Repos",
    },
    ready: "Prêt",
    start: "Démarrer",
    pause: "Pause",
    reset: "Réinitialiser",
    cycleCount: "{count} cycles",
    instructionsTitle: "Comment ça marche",
    instructions:
      "Suivez le cercle pour inspirer, retenir et expirer. Répétez sur quelques cycles.",
  },
  crisis: {
    metaTitle: "Ressources de crise",
    metaDescription: "Ressources de soutien immédiat et outils d'ancrage.",
    title: "Ressources de crise",
    subtitle:
      "Si vous ne vous sentez pas en sécurité, contactez quelqu'un maintenant. Vous méritez du soutien.",
    emergency: {
      title: "Urgence",
      call: "Appeler",
      samu: "15",
      or: "ou",
      eu: "112",
    },
    sections: {
      hotlines: "Lignes d'écoute",
      emergency: "Services d'urgence",
      support: "Organismes de soutien",
    },
    breathing: {
      title: "Respiration guidée",
      badge: "Exercice 4-7-8",
    },
    safety: {
      title: "Plan de sécurité",
      description:
        "Revoyez votre plan et vos contacts quand vous en avez besoin.",
      cta: "Ouvrir le plan de sécurité",
    },
    reassurance: {
      title: "Vous n'êtes pas seul(e)",
      emphasis: "Une aide est disponible.",
      body: "Demander de l'aide peut être le premier pas pour se sentir en sécurité.",
    },
    tips: {
      title: "Conseils d'ancrage",
      items: [
        {
          title: "Respirez lentement",
          description: "Inspirez 4 secondes, retenez 7, expirez 8.",
        },
        {
          title: "Nommez cinq choses",
          description:
            "Nommez 5 choses que vous voyez, 4 que vous sentez au toucher, 3 que vous entendez, 2 que vous sentez, 1 que vous goûtez.",
        },
        {
          title: "Demandez de l'aide",
          description: "Appelez quelqu'un de confiance ou une ligne d'écoute.",
        },
      ],
    },
    actions: {
      sms: "SMS",
      website: "Site web",
    },
    fab: {
      call: "Appeler le 3114",
      resources: "Ressources",
      needHelp: "Besoin d'aide ?",
    },
    resources: {
      "3114": {
        name: "3114 - Ligne de prévention du suicide",
        description: "Ligne nationale de prévention du suicide (France).",
        availability: "24h/24, 7j/7",
      },
      sosAmitie: {
        name: "SOS Amitie",
        description: "Service d'écoute pour les personnes en détresse.",
        availability: "Voir le site pour les horaires",
      },
      filSanteJeunes: {
        name: "Fil Sante Jeunes",
        description: "Ligne d'écoute pour les jeunes.",
        availability: "Voir le site pour les horaires",
      },
      samu: {
        name: "SAMU",
        description: "Services médicaux d'urgence.",
        availability: "Service d'urgence",
      },
      suicideEcoute: {
        name: "Suicide Ecoute",
        description: "Écoute et soutien en situation de crise.",
        availability: "Voir le site pour les horaires",
      },
      argos: {
        name: "SOS Argos",
        description: "Soutien pour les personnes bipolaires et leurs proches.",
      },
    },
  },
  labels: {
    symptoms: {
      anxiety: "Anxiété",
      irritability: "Irritabilité",
      ruminations: "Ruminations",
      agitation: "Agitation",
      brain_fog: "Brouillard mental",
      tension: "Tension",
      sadness: "Tristesse",
      euphoria: "Euphorie",
    },
    events: {
      work: "Travail",
      family: "Famille",
      sport: "Sport",
      alcohol: "Alcool",
      conflict: "Conflit",
      social_outing: "Sortie sociale",
      bad_news: "Mauvaise nouvelle",
      success: "Succès",
    },
    sleepDisturbances: {
      nightmares: "Cauchemars",
      multiple_awakenings: "Réveils multiples",
      initial_insomnia: "Difficulté d'endormissement",
      agitation: "Agitation",
      night_sweats: "Sueurs nocturnes",
      early_awakening: "Réveil précoce",
    },
    contextTags: {
      work: "Travail",
      family: "Famille",
      social: "Social",
      health: "Santé",
      sleep: "Sommeil",
      exercise: "Exercice",
      medication: "Médicaments",
      therapy: "Thérapie",
      stress: "Stress",
      relaxation: "Relaxation",
      creative: "Créatif",
      nature: "Nature",
      travel: "Voyage",
      finance: "Finances",
      relationship: "Relation",
    },
    sideEffects: {
      nausea: "Nausées",
      headache: "Maux de tête",
      dizziness: "Vertiges",
      fatigue: "Fatigue",
      insomnia: "Insomnie",
      drowsiness: "Somnolence",
      dry_mouth: "Bouche sèche",
      appetite_change: "Changement d'appétit",
      weight_change: "Changement de poids",
      tremor: "Tremblements",
      anxiety: "Anxiété",
      restlessness: "Agitation",
      constipation: "Constipation",
      blurred_vision: "Vision floue",
      sweating: "Transpiration",
    },
    sleepQuality: {
      bad: "Mauvaise",
      average: "Moyenne",
      good: "Bonne",
    },
    caregiver: {
      moodObserved: {
        very_good: "Très bon",
        good: "Bon",
        neutral: "Neutre",
        down: "Bas",
        very_down: "Très bas",
        concerning: "Préoccupant",
      },
      energyObserved: {
        high: "Élevée",
        normal: "Normale",
        low: "Faible",
        very_low: "Très faible",
      },
      socialBehavior: {
        engaged: "Engagé",
        normal: "Normal",
        withdrawn: "Replié",
        isolated: "Isolé",
      },
      sleepObserved: {
        good: "Bon sommeil",
        restless: "Agité",
        insomnia: "Insomnie",
        oversleeping: "Sommeil excessif",
      },
      eventTypes: {
        compulsive_purchase: "Achat compulsif",
        crisis: "Crise",
        conflict: "Conflit",
        milestone: "Étape",
        medication_issue: "Problème de traitement",
        other: "Autre",
      },
    },
  },
  export: {
    title: "Export personnel",
    description:
      "Téléchargez un résumé factuel de vos données aux formats PDF ou CSV.",
    presets: {
      twoWeeks: "2 semaines",
      oneMonth: "1 mois",
      threeMonths: "3 mois",
    },
    dateRange: {
      title: "Sélectionner la période",
      start: "Date de début",
      end: "Date de fin",
      invalidRange: "La date de fin doit être après la date de début",
    },
    preview: {
      title: "Aperçu de l'export",
      moodEntries: "{count} entrées d'humeur",
      therapySessions: "{count} séances de thérapie",
      exerciseLogs: "{count} exercices",
      averageMood: "Humeur moyenne",
      adherence: "Observance",
      medications: "Médicaments",
    },
    actions: {
      preview: "Aperçu",
      downloadPdf: "Télécharger PDF",
      downloadCsv: "Télécharger CSV",
      modifyPeriod: "Modifier la période",
    },
    download: {
      success: "PDF téléchargé !",
      csvSuccess: "CSV téléchargé !",
      noData: "Aucune donnée n'est disponible pour cette période.",
    },
    pdf: {
      title: "Résumé Moodday pour {name}",
      period: "Période : {start} – {end}",
      timezone: "Fuseau horaire : {timezone}",
      sections: {
        mood: "Humeur",
        medications: "Médicaments",
        therapy: "Thérapie ({count})",
        exercises: "Exercices ({count})",
      },
      stats: {
        average: "Moyenne",
        min: "Min",
        max: "Max",
        entries: "Entrées",
      },
      moreEntries: "Et {count} entrées de plus...",
      noMoodEntries: "Aucune entrée d'humeur pour cette période.",
      adherence: "Observance",
      intakeSingular: "prise",
      intakePlural: "prises",
      dosageChanges: "Changements de dosage",
      noMedications: "Aucun médicament pour cette période.",
      benefitRating: "Évaluation du bénéfice : {value}/5",
      noTherapy: "Aucune séance de thérapie pour cette période.",
      footer: "Généré le {date} par Moodday",
    },
  },
  trends: {
    metaTitle: "Tendances",
    metaDescription:
      "Explorez vos tendances et repères chiffrés dans le temps.",
    title: "Tendances",
    subtitle: "Observez côte à côte humeur, sommeil et prises déclarées.",
    periods: {
      days7: "7 derniers jours",
      days30: "30 derniers jours",
      days90: "90 derniers jours",
    },
    stats: {
      last7Days: "7 derniers jours",
      vs30Days: "vs 30 jours",
      last30Days: "30 derniers jours",
      last90Days: "90 derniers jours",
    },
    chart: {
      title: "Humeur dans le temps",
      entries: "{count} entrées",
      legend: {
        mood: "Humeur",
        dosageChange: "Changement de dosage",
      },
    },
    correlations: {
      title: "Repères chiffrés",
      sleepMood: "Association statistique sommeil / humeur",
      medicationAdherence: "Adhérence calculée sur la période",
      energyMood: "Association statistique énergie / humeur",
    },
    insights: {
      title: "Analyses marquantes",
      empty: "Pas encore d'analyses. Continuez le suivi.",
      trendUp: "Tendance à la hausse",
      trendDown: "Tendance à la baisse",
    },
  },
  onboarding: {
    title: "Bienvenue sur Moodday",
    next: "Continuer",
    skip: "Passer pour l'instant",
    start: "Commencer",
    complete: "Bienvenue ! Tout est prêt.",
    errors: {
      missingMedicationInfo: "Ajoutez un nom de médicament et un dosage.",
      invalidInviteEmail: "Saisissez un e-mail d'aidant valide.",
    },
    mood: {
      label: "Humeur du jour",
      anxietyLabel: "Niveau d'anxiété",
      noteLabel: "Note optionnelle",
      notePlaceholder: "Ajoutez une note...",
    },
    medication: {
      nameLabel: "Nom du médicament",
      namePlaceholder: "ex. Sertraline",
      dosageLabel: "Dosage",
      dosagePlaceholder: "ex. 50 mg",
      frequencyLabel: "Fréquence",
      laterHint: "Vous pourrez ajouter plus de détails plus tard.",
    },
    preferences: {
      invite: {
        title: "Inviter un aidant",
        description:
          "Proposez une invitation révocable à une personne de confiance.",
        emailPlaceholder: "E-mail de l'aidant",
        labelPlaceholder: "Libellé optionnel (ex. Dr Martin)",
      },
    },
    steps: {
      welcome: {
        title: "Bienvenue sur Moodday",
        description:
          "Ton compagnon personnel pour suivre ton parcours de santé mentale. Sans jugement, juste du soutien.",
      },
      mood: {
        title: "Suis ton humeur",
        description:
          "Note comment tu te sens pour relire les tendances issues de tes propres saisies.",
      },
      medications: {
        title: "Gère tes médicaments",
        description:
          "Garde une trace de tes médicaments, dosages et prises déclarées, sans déduction sur leur effet.",
      },
      preferences: {
        title: "Options facultatives",
        description:
          "Configure uniquement les options actuellement disponibles que tu souhaites utiliser.",
      },
      ready: {
        title: "Tu es prêt(e) !",
        description:
          "Commence ton parcours aujourd'hui. Rappelle-toi, chaque pas compte et tu fais déjà bien d'être ici.",
      },
    },
  },
  patient: {
    nav: {
      main: "Principal",
      tracking: "Suivi",
      tools: "Outils",
      support: "Support",
      mood: "Journal",
      medications: "Traitements",
      exercises: "Exercices",
      therapy: "Thérapie",
      export: "Export",
      trends: "Bilans",
      caregiver: "Suivi aidant",
      crisis: "Ressources de crise",
      safetyPlan: "Plan de sécurité",
      consultation: "Préparer une consultation",
    },
  },
  caregiver: {
    roles: {
      family: "Famille",
      friend: "Ami",
      professional: "Professionnel",
      default: "Aidant",
    },
    dashboard: {
      metaTitle: "Tableau de bord aidant",
      metaDescription:
        "Soutenez un proche en partageant des observations et des événements avec son consentement.",
      title: "Tableau de bord aidant",
      newObservation: "Nouvelle observation",
      stats: {
        week: "Cette semaine",
        month: "Ce mois-ci",
        events: "Événements",
        concerning: "Événements préoccupants",
      },
      tips: {
        title: "Conseil utile",
        highlight: "Restez constant",
        body: "Des points de contact courts et bienveillants instaurent la confiance et révèlent des tendances avec le temps.",
      },
      actions: {
        checkin: {
          title: "Saisir un check-in",
          subtitle:
            "Partagez l'humeur, l'énergie, le sommeil et le comportement.",
        },
        event: {
          title: "Signaler un événement",
          subtitle: "Notez les incidents ou changements importants.",
        },
        invite: {
          title: "Inviter un aidant",
          subtitle: "Ajoutez une personne de confiance au cercle.",
        },
      },
      activity: {
        title: "Activité récente",
        entry: "entrée",
        entries: "entrées",
        moodLabel: "Humeur",
        energyLabel: "Énergie",
        severity: "Gravité",
        badgeObservation: "Observation",
        emptyTitle: "Aucune activité pour l'instant",
        emptyDescription:
          "Créez votre premier check-in pour commencer le suivi.",
        emptyCta: "Créer un check-in",
      },
      circle: {
        title: "Cercle d'aidants",
        default: "Aidant",
        empty: "Aucun aidant pour le moment",
        inviteCta: "Inviter quelqu'un",
        removeTitle: "Retirer l'aidant ?",
        removeDescription: "L'accès aux données partagées sera révoqué.",
        removeAccessibleLabel: "Retirer {name} du cercle d'aidants",
        removeConfirm: "Retirer",
        statusPending: "En attente",
      },
      patients: {
        title: "Patients",
        empty: "Aucun patient pour l'instant",
      },
      accessLog: {
        title: "Journal des accès",
        description:
          "Consultez quand un aidant ouvre votre espace partagé. Aucune note ni donnée de santé n'est enregistrée dans ce journal.",
        sharedSpace: "Espace aidant partagé consulté",
        activity: "Activité partagée consultée",
        moodSummary: "Tendances d’humeur consultées",
        medicationSummary: "Synthèse des traitements consultée",
        empty: "Aucun accès aidant enregistré pour le moment.",
        error: "Le journal des accès est momentanément indisponible.",
      },
      digest: {
        title: "Digest des accès",
        description:
          "Recevez un récapitulatif lorsque de nouveaux accès aidant ont été enregistrés.",
        enabled: "Recevoir le digest par e-mail",
        frequency: "Fréquence",
        daily: "Quotidienne",
        weekly: "Hebdomadaire",
        privacy:
          "L’e-mail indique seulement un nombre d’accès et d’aidants. Il ne contient aucun nom, note ou donnée de santé.",
        saved: "Préférences du digest enregistrées",
        saveError: "Impossible d’enregistrer les préférences du digest",
      },
      permissions: {
        title: "Permissions",
        viewMood: "Voir les tendances d’humeur",
        viewMedications: "Voir les traitements et l’adhérence agrégée",
        addObservations: "Ajouter des observations",
        addEvents: "Ajouter des événements",
        moodWindow: "Fenêtre humeur",
        medicationWindow: "Fenêtre traitements",
        days: "{days} jours",
        expiry: "Expiration facultative",
        windows: "Humeur : {mood} j · traitements : {medication} j",
        expires: "Expire le {date}",
        noExpiry: "Sans expiration",
        manageTitle: "Gérer l’accès aidant",
        manageDescription:
          "Les changements prennent effet dès l’enregistrement et exigent une authentification récente.",
        manageAccessibleLabel: "Gérer les permissions de {name}",
        saved: "Accès aidant mis à jour",
      },
      inviteDialog: {
        title: "Inviter un aidant",
        description: "Invitez une personne de confiance à vous soutenir.",
        emailLabel: "E-mail",
        emailPlaceholder: "aidant@example.com",
        roleLabel: "Rôle",
        labelLabel: "Libellé (optionnel)",
        labelPlaceholder: "ex. Dr Martin",
        send: "Envoyer l'invitation",
        sending: "Envoi en cours...",
      },
      toasts: {
        inviteSent: "Invitation envoyée",
        removed: "Aidant retiré",
      },
    },
    activity: {
      emptyTitle: "Aucune activité pour l'instant",
      emptyDescription:
        "Les check-ins et événements des aidants apparaîtront ici.",
      badgeObservation: "Observation",
      moodLabel: "Humeur : {value}",
      energyLabel: "Énergie : {value}",
      severityLabel: "Gravité : {value}",
    },
    observe: {
      title: "Nouvelle observation",
      description:
        "Partagez une observation ou un événement avec consentement.",
      emptyTitle: "Aucune personne à accompagner",
      emptyDescription:
        "Une invitation active est nécessaire avant d'ajouter une observation ou un événement.",
      tabCheckin: "Check-in",
      tabEvent: "Événement",
      patientLabel: "Patient",
      patientPlaceholder: "Sélectionnez un patient",
    },
    checkin: {
      for: "Check-in pour {name}",
      moodObserved: "Humeur observée",
      energyObserved: "Énergie observée",
      sleepObserved: "Sommeil observé",
      socialBehavior: "Comportement social",
      notesLabel: "Notes",
      notesPlaceholder: "Ajoutez des notes (optionnel)...",
      visibleLabel: "Visible par le patient",
      visibleDescription: "Le patient verra ce check-in.",
      submit: "Enregistrer le check-in",
      saved: "Check-in enregistré",
      saveError: "Impossible d'enregistrer le check-in",
    },
    event: {
      for: "Événement pour {name}",
      typeLabel: "Type d'événement",
      dateLabel: "Date",
      descriptionLabel: "Description",
      descriptionPlaceholder: "Décrivez ce qui s'est passé...",
      severityLabel: "Gravité",
      severityScaleMin: "Faible",
      severityScaleMax: "Élevée",
      severityLabels: {
        minor: "Mineure",
        low: "Faible",
        moderate: "Modérée",
        high: "Élevée",
        critical: "Critique",
      },
      visibleLabel: "Visible par le patient",
      visibleDescription: "Le patient verra cet événement.",
      submit: "Enregistrer l'événement",
      saved: "Événement enregistré",
      saveError: "Impossible d'enregistrer l'événement",
      validation: {
        typeRequired: "Sélectionnez un type d'événement",
        descriptionMin: "La description doit contenir au moins 10 caractères",
      },
    },
    invite: {
      title: "Invitation d'aidant",
      loading: "Chargement de l'invitation...",
      invalid: "Cette invitation est invalide.",
      accept: "Accepter",
      decline: "Refuser",
      accepting: "Acceptation...",
      declining: "Refus...",
      accepted: "Invitation acceptée",
      declined: "Invitation refusée",
      alreadyAccepted: "Cette invitation a déjà été acceptée.",
      alreadyDeclined: "Cette invitation a déjà été refusée.",
      pendingSubtitle: "Vous avez été invité(e) à un cercle d'aidants.",
      signInRequiredTitle: "Connexion requise",
      signInRequiredDescription:
        "Veuillez vous connecter pour accepter cette invitation.",
      notFoundTitle: "Invitation introuvable",
      notFoundDescription: "Cette invitation est invalide ou a expiré.",
    },
    inviteEmail: {
      subject: "Vous êtes invité(e) à un cercle d'aidants Moodday",
      preview: "{patientName} vous a invité(e) à rejoindre Moodday",
      greeting: "Bonjour,",
      intro:
        "{patientName} vous a invité(e) à rejoindre son cercle d'aidants en tant que {roleLabel}.",
      labelLine: "Libellé : {label}",
      patientFallback: "Quelqu'un que vous connaissez",
      cta: "Accepter l'invitation",
      ignore: "Si vous ne vous y attendiez pas, vous pouvez ignorer cet email.",
    },
    errors: {
      selfInvite: "Vous ne pouvez pas vous inviter vous-même.",
      planLimitReached:
        "Votre offre permet {limit} aidant actif ou invité. Passez à Plus pour agrandir votre cercle.",
      alreadyInCircle: "Cet aidant est déjà dans votre cercle.",
      pendingInvite: "Une invitation est déjà en attente pour cette personne.",
      invalidInvite: "Cette invitation est invalide.",
      invalidOrExpiredInvite: "Cette invitation est invalide ou a expiré.",
      inviteExpired: "Cette invitation a expiré.",
      inviteNotForYou: "Cette invitation ne vous est pas destinée.",
      inviteAlreadyAccepted: "Cette invitation a déjà été acceptée.",
      acceptOwnInvite: "Vous ne pouvez pas accepter votre propre invitation.",
      relationshipNotFoundOrUnauthorized:
        "Relation introuvable ou non autorisée.",
      relationshipNotFound: "Relation introuvable.",
      relationshipDeleteNotAllowed:
        "Vous ne pouvez pas supprimer cette relation.",
      insufficientObservationPermission:
        "Vous n'avez pas l'autorisation d'ajouter des observations.",
      insufficientEventPermission:
        "Vous n'avez pas l'autorisation de signaler des événements.",
      readOnlyAfterDowngrade:
        "Cet accès aidant est désormais en lecture seule après le passage à l'offre Free.",
      notAllowedObserve:
        "Vous n'êtes pas autorisé(e) à ajouter des observations.",
      notAllowedReportEvent:
        "Vous n'êtes pas autorisé(e) à signaler des événements.",
    },
  },
  settings: {
    title: "Paramètres",
    subtitle:
      "Gérez vos préférences, votre confidentialité et votre abonnement.",
    tabs: {
      profile: "Profil",
      notifications: "Notifications",
      appearance: "Apparence",
      privacy: "Confidentialité",
      subscription: "Abonnement",
      security: "Sécurité",
      language: "Langue",
    },
    manageAccount: "Gérer le compte",
    profile: {
      title: "Profil",
      defaultName: "Votre nom",
      changePhoto: "Changer la photo",
      fullName: "Nom complet",
      fullNamePlaceholder: "Votre nom complet",
      timezone: "Fuseau horaire",
      save: "Enregistrer le profil",
    },
    display: {
      title: "Affichage",
      chartPeriod: "Période par défaut des graphiques",
      chartPeriodHint: "Plage de temps par défaut pour les courbes d'humeur",
      days7: "7 jours",
      days30: "30 jours",
      days90: "90 jours",
    },
    notifications: {
      title: "Notifications",
      enabled: "Activer les notifications",
      enabledHint: "Recevoir des rappels et mises à jour",
      permissionDenied:
        "L’autorisation de notification n’a pas été accordée. Vous pouvez la modifier dans les réglages du navigateur.",
      dailyCheckIn: "Rappel quotidien",
      dailyCheckInHint: "Rappel pour noter ton humeur",
      checkInTime: "Heure du rappel",
      medicationReminders: "Rappels médicaments",
      medicationRemindersHint: "Rappels pour prendre tes médicaments",
      medicationReminderTime: "Heure du rappel médicaments",
      medicationReminderTimeHint: "Choisissez l'heure des rappels médicaments",
    },
    appearance: {
      title: "Apparence",
      themeLabel: "Thème",
    },
    privacy: {
      title: "Confidentialité et données",
      exportJson: "Exporter JSON",
      exportJsonDescription:
        "Téléchargez l'export complet de vos données (RGPD).",
      exportPdf: "Exporter PDF",
      exportPdfDescription:
        "Générez un résumé personnel factuel au format PDF.",
      exportSuccess: "Export prêt",
      exporting: "Export en cours...",
      deleteTitle: "Supprimer le compte",
      deleteWarning: "Cela supprimera définitivement vos données.",
      deleteDialogTitle: "Confirmer la suppression",
      deleteDialogDescription: "Cette action est irréversible.",
      deleteConfirm: "Supprimer mon compte",
      deleting: "Suppression...",
      accountDeleted: "Compte supprimé",
      policyTitle: "Politique de confidentialité",
      policyDescription: "Découvrez comment nous traitons vos données.",
      policyCta: "Lire la politique",
      aiTitle: "Bilans assistés par IA",
      aiDescription:
        "Avec votre accord, Moodday peut transmettre un résumé minimisé de vos données à OpenAI pour générer un bilan factuel. Cette fonction est réservée à Plus et reste désactivée par défaut.",
      aiConsent: "Autoriser les bilans IA",
      aiConsentDescription:
        "Uniquement les valeurs d’humeur, d’énergie, d’anxiété et de sommeil affichées dans le bilan.",
      aiNotes: "Inclure mes notes de journal",
      aiNotesDescription:
        "Option séparée et désactivée par défaut. Vous pouvez la retirer à tout moment.",
      aiDisclaimer:
        "Le stockage de la réponse API est désactivé. Les bilans ne posent pas de diagnostic et ne recommandent aucune modification de traitement. En cas d'urgence, contactez le 15/112 ou le 3114.",
      aiSaved: "Préférences IA enregistrées",
      aiSaveError: "Impossible d'enregistrer les préférences IA",
    },
    offline: {
      title: "Synchronisation hors ligne",
      subtitle:
        "Contrôlez les actions enregistrées sur cet appareil avant leur synchronisation.",
      online: "Connexion disponible",
      offline: "Vous êtes hors ligne",
      onlineDescription:
        "Les opérations en attente peuvent être envoyées en toute sécurité.",
      offlineDescription:
        "Les opérations restent sur cet appareil jusqu'au retour de la connexion.",
      pendingTitle: "Opérations en attente",
      privacyNotice:
        "Cette page n'affiche jamais le contenu de votre journal ni vos informations de traitement.",
      emptyTitle: "Tout est synchronisé",
      emptyDescription: "Aucune opération locale n'attend d'être envoyée.",
      loadErrorTitle: "File locale indisponible",
      loadErrorDescription:
        "Fermez les autres onglets Moodday, puis rechargez cette page.",
      retry: "Réessayer",
      retryAll: "Tout synchroniser",
      discard: "Supprimer de cet appareil",
      discardTitle: "Supprimer cette opération locale ?",
      discardDescription:
        "Elle ne sera pas envoyée au serveur. Cette action est irréversible.",
      cancel: "Annuler",
      confirmDiscard: "Supprimer",
      retryStarted: "Nouvelle tentative lancée",
      discarded: "Opération locale supprimée",
      syncComplete: "Synchronisation terminée",
      syncIncomplete: "Certaines opérations demandent encore votre attention.",
      syncError:
        "La synchronisation n'a pas pu démarrer. Réessayez dans un instant.",
      diagnosticTitle: "Diagnostic technique",
      diagnosticDescription:
        "Téléchargez les compteurs de file et de stockage sans journal, traitement, thérapie, erreur ni donnée de compte.",
      downloadDiagnostic: "Télécharger le diagnostic",
      diagnosticReady: "Diagnostic prêt",
      diagnosticError: "Le diagnostic n'a pas pu être généré.",
      loading: "Chargement des opérations locales",
      createdAt: "Enregistrée le {date}",
      attempts: "{count} tentative(s)",
      status: {
        pending: "En attente",
        syncing: "Synchronisation",
        failed: "À réessayer",
        conflict: "Action requise",
      },
      operation: {
        mood: "Entrée de journal",
        med_intake: "Prise planifiée",
        med_skip: "Prise ignorée",
        med_prn_intake: "Prise à la demande",
        exercise_log: "Exercice terminé",
        therapy_create: "Séance ajoutée",
      },
    },
    security: {
      description:
        "Gérez vos informations de connexion et protégez votre compte.",
    },
    subscription: {
      title: "Abonnement",
      unavailableTitle: "La facturation est actuellement indisponible",
      unavailableDescription:
        "Aucun paiement ni aucune gestion d'abonnement n'est disponible tant que la facturation est désactivée.",
      statusLabel: "Statut",
      status: {
        active: "Actif",
        trialing: "Essai",
        pastDue: "En retard",
        canceled: "Annulé",
        incomplete: "Incomplet",
        inactive: "Inactif",
      },
      planLabel: "Offre : {plan}",
      planFree: "Offre gratuite",
      renewal: "Renouvelle le {date}",
      noActive: "Aucun abonnement actif",
      includedTitle: "Fonctionnalités incluses",
      features: [
        "Suivi d'humeur illimité",
        "Rappels de médicaments",
        "Export PDF",
      ],
      changePlan: "Changer d'offre",
    },
    timezones: {
      paris: "Paris",
      london: "Londres",
      newYork: "New York",
    },
    saved: "Paramètres sauvegardés !",
    sidebar: {
      profile: "Profil",
      notifications: "Notifications",
      appearance: "Apparence",
      privacy: "Confidentialité",
      offline: "Synchronisation",
      subscription: "Abonnement",
      security: "Sécurité",
      language: "Langue",
    },
    upgrade: "Passer à Premium",
  },
  debug: {
    title: "Panneau de debug",
    info: "Infos",
    actions: "Actions",
    noActions: "Aucune action enregistrée",
    user: "Utilisateur",
    session: "Session",
    notLoggedIn: "Non connecté",
    null: "null",
  },
  theme: {
    title: "Thème",
    dark: "Sombre",
    light: "Clair",
    system: "Système",
    zen: "Zen",
  },
  sidebar: {
    title: "Barre latérale",
    description: "Affiche la barre latérale mobile.",
    toggle: "Basculer la barre latérale",
  },
  breadcrumb: {
    label: "Fil d'Ariane",
    more: "Plus",
  },
  pagination: {
    label: "Pagination",
    previous: "Précédent",
    next: "Suivant",
    previousAria: "Aller à la page précédente",
    nextAria: "Aller à la page suivante",
    more: "Plus de pages",
  },
  months: {
    january: "Janvier",
    february: "Février",
    march: "Mars",
    april: "Avril",
    may: "Mai",
    june: "Juin",
    july: "Juillet",
    august: "Août",
    september: "Septembre",
    october: "Octobre",
    november: "Novembre",
    december: "Décembre",
  },
  images: {
    dropHere: "Déposez ici",
    upload: "Téléverser",
    onlyAccept: "Accepte uniquement : {types}",
    errors: {
      uploadFailed: "Échec du téléversement",
      invalidType: "Type de fichier invalide",
      invalidTypeDescription: "Seuls png, jpg, jpeg sont autorisés",
      fileTooLarge: "Fichier trop volumineux (max 1 Mo)",
      fileTooLargeDescription:
        "Utilisez https://tinypng.com/ pour compresser l'image",
    },
  },
  feedback: {
    button: "Avis",
    message: "Message",
    send: "Envoyer",
    sent: "Avis envoyé",
  },
  support: {
    contact: "Contacter le support",
    title: "Contacter le support",
    descriptionPrefix: "Vous pouvez nous écrire à ",
    descriptionSuffix: " et nous vous répondrons dès que possible.",
    subject: "Sujet",
    message: "Message",
    send: "Envoyer",
    sent: "Message envoyé",
  },
  pricing: {
    title: "Tarifs simples et transparents",
    description: "Choisissez l'offre qui vous convient.",
    descriptionUnavailable:
      "Les offres sont présentées à titre informatif. La souscription Plus n'est pas encore ouverte.",
    monthly: "Mensuel",
    yearly: "Annuel",
    save: "Économisez {percent}",
    footer: "Annulez à tout moment. Aucun frais caché.",
    footerUnavailable:
      "Aucun paiement ne peut être initié tant que la facturation reste désactivée.",
    customPlan: "Besoin d'une offre sur mesure ?",
    contact: "Contactez-nous",
    checkoutCanceled: {
      title: "Paiement annulé",
      description:
        "Pas de souci — vous pourrez changer d'offre quand vous le souhaitez.",
      back: "Retour aux tarifs",
    },
    dialog: {
      title: "Choisissez une offre et lancez-vous",
      description:
        "Débloquez toutes les fonctionnalités et faites grandir votre activité.",
    },
  },
  pricingCard: {
    perMonth: "/mois",
    save: "Économisez {percent}",
    billedYearly: "Facturé à l'année : {amount}",
    freeTrial: "Essai gratuit {days} jours",
    includes: "Inclus",
    signInRequired: "Veuillez vous connecter pour mettre à niveau",
    upgradeError: "Impossible de démarrer le paiement",
    ctaFree: "Commencer gratuitement",
    ctaMonthly: "Choisir mensuel",
    ctaYearly: "Choisir annuel",
    ctaUnavailable: "Pas encore disponible",
  },
  plans: {
    names: {
      free: "Gratuit",
      plus: "Plus",
    },
    descriptions: {
      free: "Suivi quotidien essentiel et journal personnel",
      plus: "Bilans avancés et historique analytique étendu",
    },
    limits: {
      medications: {
        label: "{value} médicaments",
        labelUnlimited: "Médicaments illimités",
        description: "Suivre vos traitements",
      },
      historyDays: {
        label: "Historique {value} jours",
        labelUnlimited: "Historique complet",
        description: "Accès à vos données passées",
      },
      caregivers: {
        label: "{value} aidants",
        labelOne: "1 aidant",
        labelUnlimited: "Aidants illimités",
        labelNone: "Pas d'aidants",
        description: "Partager avec vos proches",
      },
    },
    additionalFeatures: {
      free: [
        {
          label: "Suivi d'humeur quotidien",
          description: "Enregistrez votre humeur chaque jour",
        },
        {
          label: "Journal basique",
          description: "Notez vos pensées et émotions",
        },
      ],
      plus: [
        {
          label: "Rapport de consultation",
          description: "Préparez un bilan clair et sourcé",
        },
        {
          label: "Insights IA",
          description: "Huit bilans sourcés par mois, sans diagnostic",
        },
        {
          label: "Cercle aidant étendu",
          description: "Jusqu'à trois aidants avec permissions explicites",
        },
      ],
    },
  },
  app: {
    searchPlaceholder: "Rechercher...",
    commandTitle: "Palette de commandes",
    commandDescription: "Recherchez une commande à exécuter...",
    commandPlaceholder: "Tapez une commande ou recherchez...",
    commandEmpty: "Aucun résultat trouvé.",
    analytics: {
      title: "Vue d'ensemble des analyses",
      description: "Suivez vos performances et comprenez votre audience.",
    },
    cards: {
      totalLikes: "Total des likes",
      totalLikesDelta: "+12 % vs le mois dernier",
      totalThreads: "Total des threads",
      totalThreadsDelta: "+8 % vs le mois dernier",
      newSubscribers: "Nouveaux abonnés",
      newSubscribersDelta: "+5 % vs le mois dernier",
      impressions: "Impressions",
      impressionsDelta: "+18 % vs le mois dernier",
    },
    subscribers: {
      title: "Abonnés",
      description: "Nouveaux abonnés dans le temps",
      trending: "En hausse de {value} ce mois-ci",
      range: "Janvier - Juin {year}",
    },
    upgrade: {
      title: "Passez à l'offre supérieure",
      description: "Débloquez plus de fonctionnalités pour votre compte.",
      cta: "Mettre à niveau",
    },
  },
  admin: {
    panel: "Panneau d'administration",
    nav: {
      section: "Administration",
    },
    dashboard: {
      title: "Tableau de bord admin",
    },
    stats: {
      totalUsers: "Utilisateurs totaux",
      totalUsersDescription: "Tous les comptes enregistrés",
      premiumUsers: "Utilisateurs premium",
      premiumUsersDescription: "Abonnements payants actifs",
      mrr: "Revenu récurrent mensuel",
      mrrDescription: "Revenu mensuel estimé",
      newUsersThisMonth: "+{count} ce mois-ci",
    },
    feedback: {
      title: "Retours",
      description: "Consultez les retours des utilisateurs.",
      searchPlaceholder: "Rechercher des retours...",
      empty: "Aucun retour trouvé.",
      detailTitle: "Détails du retour",
      submitted: "Envoyé",
      viewDetails: "Voir les détails",
      noRating: "Aucune note",
      ratings: {
        extremelyDissatisfied: "Très insatisfait",
        somewhatDissatisfied: "Plutôt insatisfait",
        neutral: "Neutre",
        satisfied: "Satisfait",
      },
      reply: {
        button: "Répondre",
        title: "Répondre au retour",
        description: "Envoyer une réponse à {name}.",
        message: "Message",
        placeholder: "Écrivez votre réponse...",
        send: "Envoyer la réponse",
        sent: "Réponse envoyée",
        failed: "Échec de l'envoi",
      },
    },
    users: {
      title: "Utilisateurs",
      searchPlaceholder: "Rechercher des utilisateurs...",
      empty: "Aucun utilisateur trouvé.",
      actionsMenu: "Ouvrir le menu d'actions",
      actions: {
        impersonate: "Usurper",
        makeAdmin: "Passer admin",
        makeUser: "Passer utilisateur",
        unban: "Débannir",
        ban: "Bannir",
      },
      status: {
        active: "Actif",
        banned: "Banni",
      },
      roles: {
        admin: "Administrateur",
        user: "Utilisateur",
      },
      banReason: "Violation des conditions",
      banConfirm: "Bannir {name} ?",
      banFailed: "Échec du bannissement : {error}",
      banned: "Utilisateur banni",
      unbanFailed: "Échec du débannissement : {error}",
      unbanned: "Utilisateur débanni",
      impersonating: "Usurpation en cours",
      impersonateFailed: "Échec de l'usurpation : {error}",
      roleUpdated: "Rôle mis à jour",
      roleUpdateFailed: "Échec de la mise à jour du rôle : {error}",
      stopImpersonating: "Arrêter l'usurpation",
      anonymous: "Anonyme",
      noEmail: "Aucun email",
      unverified: "Non vérifié",
      table: {
        user: "Utilisateur",
        role: "Rôle",
        status: "Statut",
        joined: "Inscrit",
        created: "Créé",
        actions: "Actions",
      },
    },
    userDetails: {
      title: "Détails utilisateur",
      description: "Gérez les informations du compte et les sessions.",
      subscriptionTitle: "Abonnement",
      subscriptionStatus: {
        active: "Actif",
        canceled: "Annulé",
        trialing: "Essai",
        past_due: "En retard",
        unpaid: "Impayé",
        incomplete: "Incomplet",
      },
      noSubscription: "Aucun abonnement.",
      noName: "Utilisateur sans nom",
      created: "Créé",
      providers: {
        title: "Fournisseurs connectés",
        description: "Comptes externes liés à cet utilisateur.",
        empty: "Aucun fournisseur connecté.",
        emailPassword: "Email/mot de passe",
        status: {
          active: "Actif",
          connected: "Connecté",
          inactive: "Inactif",
        },
        table: {
          provider: "Fournisseur",
          status: "Statut",
          connected: "Connecté le",
          accountId: "ID du compte",
        },
      },
      sessions: {
        title: "Sessions",
        description: "Sessions actives pour cet utilisateur.",
        loading: "Chargement des sessions...",
        loadFailed: "Échec du chargement des sessions : {error}",
        empty: "Aucune session.",
        revokeAllTitle: "Révoquer toutes les sessions",
        revokeAllDescription: "Cela déconnectera l'utilisateur partout.",
        revokeAllAction: "Révoquer tout",
        revokeAllFailed: "Échec de la révocation : {error}",
        revokedAll: "Toutes les sessions ont été révoquées",
        revokeFailed: "Échec de la révocation de la session : {error}",
        revoked: "Session révoquée",
        table: {
          device: "Appareil",
          ip: "Adresse IP",
          status: "Statut",
          created: "Créé",
          expires: "Expire",
          actions: "Actions",
        },
        status: {
          active: "Actif",
          expired: "Expirée",
          impersonated: "Usurpée",
        },
        unknownDevice: "Appareil inconnu",
        unknownBrowser: "Navigateur inconnu",
        unknownOs: "OS inconnu",
        unknownIp: "IP inconnue",
        deviceFormat: "{browser} sur {os}",
      },
    },
  },
  account: {
    title: "Compte",
    metaTitle: "Compte",
    metaDescription: "Gérez les paramètres de votre compte",
    settings: {
      title: "Paramètres du compte",
      signOut: "Se déconnecter",
    },
    profile: {
      section: "Votre profil",
      profile: "Profil",
      mail: "E-mail",
      danger: "Attention",
      updated: "Profil mis à jour",
      verifySent: "Email de vérification envoyé",
      verifyEmail: "Vérifier l'email",
      verifiedTooltip: "Email vérifié",
      changeEmail: "Modifier l'email",
      changePassword: "Modifier le mot de passe",
      editTitle: "Paramètres",
      editDescription: "Mettez à jour votre profil.",
    },
    password: {
      title: "Changer le mot de passe",
      description:
        "Mettez à jour votre mot de passe pour sécuriser votre compte.",
      currentRequired: "Le mot de passe actuel est requis",
      minLength: "Le mot de passe doit contenir au moins 8 caractères",
      mismatch: "Les mots de passe ne correspondent pas",
      currentLabel: "Mot de passe actuel",
      newLabel: "Nouveau mot de passe",
      confirmLabel: "Confirmer le mot de passe",
      revokeLabel: "Se déconnecter des autres appareils",
      revokeDescription: "Fermer toutes les autres sessions actives.",
      submit: "Mettre à jour",
      success: "Mot de passe mis à jour",
    },
    email: {
      metaTitle: "Préférences email",
      metaDescription: "Gérez vos préférences email.",
      title: "Préférences email",
      description: "Choisissez les emails que vous souhaitez recevoir.",
      changeTitle: "Modifier l'email",
      changeDescription: "Mettez à jour votre adresse email.",
      newLabel: "Nouvel email",
      newPlaceholder: "vous@exemple.com",
      changeSubmit: "Envoyer le lien de vérification",
      invalid: "Saisissez un email valide",
      verifySent: "Email de vérification envoyé",
      unsubscribeLabel: "Se désabonner",
      unsubscribeDescription: "Ne plus recevoir les mises à jour.",
      updated: "Préférences mises à jour",
      errorTitle: "Paramètres email indisponibles",
      errorDescription: "Impossible de charger vos préférences email.",
    },
    billing: {
      metaTitle: "Facturation",
      metaDescription:
        "Gérez votre abonnement et vos informations de facturation.",
      title: "Facturation",
      freeTitle: "Vous êtes sur l'offre gratuite",
      freeDescription:
        "Passez à une offre supérieure pour débloquer les fonctionnalités premium.",
      manage: "Gérer l'abonnement",
      cancel: "Annuler l'abonnement",
      reactivate: "Réactiver",
      detailsTitle: "Détails de facturation",
      limitsTitle: "Limites du plan",
      plan: "Formule",
      startDate: "Date de début",
      renewAt: "Renouvelle le",
      endsOn: "Se termine le",
      trialRemaining: "{days} jours restants d'essai",
      noStripeCustomer: "ID client Stripe manquant",
      success: {
        metaTitle: "Paiement réussi",
        metaDescription: "Votre abonnement est actif.",
        title: "Paiement réussi",
        description: "Votre abonnement est désormais actif. Merci !",
      },
      goDashboard: "Aller au tableau de bord",
      status: {
        trialing: "Essai",
        trialingDescription: "Essai en cours",
        active: "Actif",
        activeDescription: "Abonnement actif",
        canceled: "Annulé",
        canceledDescription: "Abonnement annulé",
        pastDue: "En retard",
        pastDueDescription: "Paiement en retard",
        unpaid: "Impayé",
        unpaidDescription: "Paiement échoué",
        incomplete: "Incomplet",
        incompleteDescription: "Paiement incomplet",
      },
    },
    danger: {
      title: "Supprimer le compte",
      description:
        "Supprime définitivement votre compte et toutes les données associées.",
      personalTitle: "Compte personnel",
      personalDescription:
        "Supprimez vos données personnelles et votre profil.",
      orgTitle: "Données d'organisation",
      orgDescription: "Supprimez les données partagées.",
      confirmTitle: "Confirmer la suppression",
      confirmDescription: "Cette action est irréversible.",
      confirmText: "Supprimer le compte",
      requestedTitle: "Suppression demandée",
      requestedDescription: "Nous avons reçu votre demande.",
      delete: "Supprimer le compte",
    },
    export: {
      title: "Exporter mes données",
      description:
        "Téléchargez toutes vos données personnelles au format JSON (RGPD).",
      dataIncludedTitle: "Données incluses",
      dataIncludedDescription:
        "Profil, humeurs, médicaments, sessions de thérapie et exercices.",
      button: "Télécharger mes données",
      success: "Vos données ont été téléchargées",
    },
  },
  auth: {
    notSignedIn: "Veuillez vous connecter pour continuer.",
    form: {
      name: "Nom",
      email: "E-mail",
      emailPlaceholder: "vous@exemple.com",
      password: "Mot de passe",
    },
    signIn: {
      metaTitle: "Se connecter à {app}",
      metaDescription: "Accédez à votre compte pour gérer vos témoignages.",
      title: "Se connecter",
      description: "Connectez-vous pour accéder à votre tableau de bord.",
      emailPlaceholder: "vous@exemple.com",
      forgotPassword: "Mot de passe oublié ?",
      submit: "Se connecter",
      magicLinkSubmit: "Envoyer le lien magique",
      magicLinkPrompt: "Préférez un lien magique ?",
      magicLinkAction: "Utiliser un lien magique",
      passwordPrompt: "Préférez un mot de passe ?",
      passwordAction: "Utiliser un mot de passe",
      noAccount: "Pas encore de compte ?",
      signUp: "Créer un compte",
      or: "ou",
      lastUsed: "Dernier utilisé",
      provider: "Continuer avec {provider}",
    },
    signUp: {
      metaTitle: "Créer votre compte {app}",
      metaDescription: "Commencez à collecter des témoignages dès aujourd'hui.",
      title: "Créer votre compte {app}",
      description: "Commencez en quelques minutes avec un compte gratuit.",
      namePlaceholder: "Votre nom",
      emailPlaceholder: "vous@exemple.com",
      verifyPassword: "Confirmer le mot de passe",
      passwordMismatch: "Les mots de passe ne correspondent pas",
      ageConsent: "Je confirme avoir au moins 18 ans.",
      termsConsent: "J’accepte les",
      privacyConsent: "J’ai lu et j’accepte la",
      healthDataConsent:
        "Je consens explicitement au traitement de mes données d’humeur, de thérapie et de traitement uniquement afin de fournir mon journal personnel Moodday. Le service ne peut pas fonctionner sans ce traitement.",
      submit: "Créer un compte",
      hasAccount: "Vous avez déjà un compte ?",
      signIn: "Se connecter",
      validation: {
        nameRequired: "Le nom est requis",
        emailInvalid: "Saisissez une adresse e-mail valide",
        passwordMin: "Le mot de passe doit contenir au moins 8 caractères",
        verifyPasswordMin:
          "La confirmation doit contenir au moins 8 caractères",
        passwordMismatch: "Les mots de passe ne correspondent pas",
        ageRequired: "Vous devez avoir au moins 18 ans.",
        termsRequired: "Vous devez accepter les conditions.",
        privacyRequired: "Vous devez accepter la politique de confidentialité.",
        healthDataConsentRequired:
          "Votre consentement explicite au traitement des données de santé est requis pour utiliser le journal Moodday.",
      },
    },
    forgetPassword: {
      metaTitle: "Réinitialiser votre mot de passe {app}",
      metaDescription: "Nous vous enverrons un lien de réinitialisation.",
      title: "Mot de passe oublié ?",
      description:
        "Saisissez votre email pour recevoir un lien de réinitialisation.",
      submit: "Envoyer le lien",
    },
    resetPassword: {
      metaTitle: "Choisir un nouveau mot de passe",
      metaDescription: "Définissez un nouveau mot de passe pour votre compte.",
      title: "Définir un nouveau mot de passe",
      description: "Choisissez un mot de passe sécurisé.",
      newPassword: "Nouveau mot de passe",
      passwordPlaceholder: "Au moins 8 caractères",
      passwordMin: "Le mot de passe doit contenir au moins 8 caractères",
      submit: "Mettre à jour",
      success: "Mot de passe mis à jour",
    },
    confirmDelete: {
      metaTitle: "Confirmer la suppression du compte",
      metaDescription: "Confirmez la suppression de votre compte.",
      title: "Confirmer la suppression du compte",
      description: "Cette action est irréversible.",
      confirm: "Supprimer le compte",
      invalidToken: "Jeton invalide ou expiré",
    },
    newUser: {
      metaTitle: "Bienvenue sur {app}",
      metaDescription: "Votre compte est prêt.",
      title: "Tout est prêt !",
      description: "Votre compte est prêt à être utilisé.",
      cta: "Aller au tableau de bord",
    },
    goodbye: {
      metaTitle: "Déconnecté de {app}",
      metaDescription: "Vous avez été déconnecté.",
      title: "Vous êtes déconnecté",
      description: "Nous espérons vous revoir bientôt.",
      detailOne: "Vous pouvez vous reconnecter à tout moment.",
      detailTwo: "Besoin d'un nouveau compte ? Créez-en un en quelques clics.",
      cta: "Créer un compte",
    },
    verify: {
      metaTitle: "Vérifiez votre email",
      metaDescription:
        "Consultez votre boîte de réception pour vérifier votre email.",
      title: "Vérifiez votre email",
      description: "Nous vous avons envoyé un lien de vérification.",
      checkInbox: "Vérifiez votre boîte de réception",
      instructions:
        "Cliquez sur le lien dans l'email pour vérifier votre adresse.",
      spamHelp: "Si vous ne le voyez pas, vérifiez les spams.",
      support: "Besoin d'aide ? Contactez le support.",
    },
    error: {
      message: "Une erreur est survenue",
    },
    logout: "Se déconnecter",
  },
  email: {
    section: {
      title: "Restez informé",
      description:
        "Recevez les dernières nouvelles sur les fonctionnalités, mises à jour et bonnes pratiques SaaS.",
      submit: "S'abonner",
      success: "Merci de votre inscription",
    },
    submit: "S'abonner",
    success: "Vous êtes inscrit à notre newsletter.",
    placeholder: "Votre email",
    invalid: "Saisissez un email valide",
    errorDescription: "Essayez un autre email ou contactez-nous.",
  },
  form: {
    unsavedWarning:
      "Vous avez des modifications non enregistrées. Voulez-vous vraiment quitter ?",
  },
  posts: {
    metaTitle: "Blog {app}",
    metaDescription: "Actualités, conseils et histoires de l'équipe.",
    title: "Blog",
    emptyTitle: "Aucun article trouvé",
    viewAll: "Voir tous les articles",
    back: "Retour",
    draft: "Brouillon",
    publishedBy: "Publié {date}",
    readingTime: "Temps de lecture {minutes} min",
    createdBy: "Créé par",
    category: {
      title: "Articles de blog sur {category}",
      metaTitle: "Blog {app} sur {category}",
    },
    notFound: {
      title: "404 - Introuvable",
      description: "L'article demandé n'existe pas.",
    },
    error: {
      title: "Erreur avec l'article",
      description:
        "Désolé, l'article ne fonctionne pas comme prévu. Veuillez réessayer plus tard.",
    },
  },
  about: {
    metaTitle: "À propos de {app}",
    metaDescription:
      "Découvrez le périmètre de Moodday, compagnon de suivi personnel non médical.",
    hero: {
      kicker: "Notre histoire",
      titlePrefix: "Une façon plus apaisée de",
      titleHighlight: "consigner ses repères",
      description:
        "Moodday est un journal personnel pour consigner humeur, sommeil et traitements déclarés, sans diagnostic.",
    },
    mission: {
      title: "Notre mission",
      paragraphOne:
        "Rendre le suivi personnel de la santé mentale simple, bienveillant et utile.",
      paragraphTwo:
        "Offrir à chacun un historique clair qu'il peut choisir de partager avec une personne de confiance.",
    },
    vision: {
      title: "Notre vision",
      paragraphOne: "Un monde où chacun se sent soutenu entre les rendez-vous.",
      paragraphTwo:
        "Des données personnelles organisées pour préparer les sujets que chacun choisit d’aborder.",
    },
    values: {
      title: "Nos valeurs",
      items: {
        kindness: {
          title: "La bienveillance d'abord",
          description: "Nous concevons avec empathie et réduisons le jugement.",
        },
        privacy: {
          title: "Confidentialité par défaut",
          description:
            "Vous gardez le contrôle de vos partages, exports et suppressions.",
        },
        science: {
          title: "Prudence des formulations",
          description:
            "Nous séparons les observations des interprétations et excluons le diagnostic et le conseil médical.",
        },
      },
    },
    team: {
      title: "Une petite équipe avec une grande mission",
      description:
        "Pour une question produit, de support ou de confidentialité, utilisez notre canal de contact documenté.",
      contactCta: "Nous contacter",
    },
    privacyPromise: {
      title: "Promesse de confidentialité",
      description:
        "Vous disposez de contrôles pour vos partages, vos exports et la suppression de votre compte. Les traitements sont décrits dans la politique de confidentialité.",
    },
  },
  contact: {
    metaTitle: "Contact {app}",
    metaDescription:
      "Contactez l'équipe Moodday. Nous sommes là pour répondre aux questions de support, de confidentialité et de produit.",
    title: "Nous contacter",
    description:
      "Des questions sur Moodday ou besoin d'aide avec votre compte ? Nous sommes là pour vous aider.",
    cards: {
      email: {
        title: "Nous écrire",
        description:
          "Contactez l'équipe support pour vos questions produit ou compte.",
      },
      response: {
        title: "Délai de réponse",
        description:
          "Les demandes sont traitées les jours ouvrés, au meilleur effort.",
        value: "Aucun délai contractuel",
      },
      social: {
        title: "Réseaux sociaux",
        description: "Suivez nos actualités et annonces.",
      },
    },
    form: {
      title: "Envoyer un message",
      subtitle: "Nous reviendrons vers vous dès que possible.",
      firstName: "Prénom",
      lastName: "Nom",
      email: "E-mail",
      subject: "Sujet",
      message: "Message",
      submit: "Envoyer le message",
      success: "Votre message a été envoyé",
      invalid: "Entrée invalide",
    },
    faq: {
      title: "Questions fréquentes",
      items: {
        free: {
          question: "Moodday est-il gratuit ?",
          answer:
            "L'offre gratuite est disponible. L'offre Plus et son tarif sont présentés dans le produit, mais la souscription n'est possible que lorsque son bouton d'achat est explicitement activé.",
        },
        security: {
          question: "Comment protégez-vous mes données ?",
          answer:
            "Les connexions utilisent HTTPS/TLS, les accès sont contrôlés côté serveur et vous choisissez ce qui est partagé.",
        },
        export: {
          question: "Puis-je exporter mes données pour les partager ?",
          answer:
            "Oui. Vous pouvez générer un export PDF, CSV ou JSON et choisir vous-même avec qui le partager.",
        },
      },
      more: "Vous avez encore une question ? Contactez notre équipe.",
    },
  },
  legal: {
    terms: {
      metaTitle: "{app} - Conditions Générales d'Utilisation",
      metaDescription:
        "Conditions générales d'utilisation de l'application Moodday",
      title: "Conditions Générales d'Utilisation",
      subtitle:
        "Ces conditions expliquent comment Moodday fonctionne et comment l'utiliser en toute sécurité.",
      lastUpdated: "Dernière mise à jour : août 2026",
      emergency: {
        title: "En cas d'urgence",
        descriptionPrefix:
          "Si vous êtes en détresse, contactez les services d'urgence au ",
        phone: "3114",
        descriptionSuffix:
          ". En cas de danger immédiat, appelez le 15 ou le 112.",
      },
      contact: {
        title: "Des questions ?",
        descriptionPrefix: "Contactez-nous à ",
      },
      sections: {
        publisher: {
          title: "Éditeur du service",
          content:
            "Moodday est édité par {publisher}, {legalForm}, immatriculé sous le SIREN {siren}. Contact : hello@moodday.app.",
        },
        service: {
          title: "Objet du service",
          content:
            "Moodday est un outil de suivi personnel pour enregistrer l'humeur, les traitements et les analyses.",
          highlight: "Moodday n'est pas un dispositif médical.",
        },
        account: {
          title: "Compte et éligibilité",
          items: {
            age: "Vous devez avoir au moins 18 ans et résider en France lors de ce lancement.",
            accurateInfo: "Fournissez des informations d'inscription exactes.",
            credentials: "Gardez vos identifiants confidentiels.",
            responsibility:
              "Vous êtes responsable de l'activité de votre compte.",
          },
        },
        acceptableUse: {
          title: "Utilisation acceptable",
          items: {
            personalTracking:
              "Utilisez Moodday uniquement pour votre suivi personnel.",
            noSharing: "Ne partagez pas vos identifiants.",
            noBypass: "N'essayez pas de contourner les mesures de sécurité.",
            respect: "Respectez les autres utilisateurs et la loi.",
          },
        },
        caregiver: {
          title: "Cercle d'aidants",
          content:
            "Vous contrôlez ce qui est partagé. L'accès peut être révoqué à tout moment.",
        },
        ip: {
          title: "Propriété intellectuelle",
          content:
            "Tout le contenu et la marque appartiennent à Moodday ou à ses concédants.",
        },
        liability: {
          title: "Limitation de responsabilité",
          items: {
            decisions: "Moodday n'est pas responsable des décisions médicales.",
            interruptions: "Des interruptions de service peuvent survenir.",
            losses:
              "Nous ne sommes pas responsables des pertes de données hors de notre contrôle.",
          },
          highlight: "Le service est fourni « en l'état ».",
        },
        termination: {
          title: "Résiliation",
          content:
            "Vous pouvez supprimer votre compte à tout moment depuis les paramètres.",
        },
        law: {
          title: "Droit applicable",
          content: "Ces conditions sont régies par le droit français.",
        },
      },
      content:
        "## Éditeur\n\nMoodday est édité par Yodev, entrepreneur individuel, SIREN 803 272 590. Contact : hello@moodday.app.\n\n## 1. Objet\n\nLes présentes Conditions Générales d'Utilisation (CGU) régissent l'utilisation de l'application Moodday, un journal confidentiel destiné au suivi personnel de la santé mentale.\n\n## 2. Nature du service\n\n**Moodday n'est pas un dispositif médical.** L'application est un outil de suivi personnel qui vous permet de :\n- Enregistrer vos humeurs quotidiennes\n- Suivre vos traitements médicamenteux\n- Générer des rapports que vous choisissez de partager\n\nMoodday ne fournit aucun avis médical, diagnostic ou traitement. En cas de détresse ou d'urgence, contactez immédiatement un professionnel de santé ou le 3114 (numéro national de prévention du suicide).\n\n## 3. Inscription et compte\n\nPour utiliser Moodday, vous devez :\n- Être âgé d'au moins 18 ans et résider en France\n- Fournir des informations exactes lors de l'inscription\n- Maintenir la confidentialité de vos identifiants\n\nVous êtes responsable de toute activité effectuée sur votre compte.\n\n## 4. Utilisation acceptable\n\nVous vous engagez à :\n- Utiliser l'application uniquement pour votre suivi personnel\n- Ne pas partager vos identifiants\n- Ne pas tenter de contourner les mesures de sécurité\n- Respecter les droits des autres utilisateurs\n\n## 5. Cercle d'aidants\n\nSi vous invitez un proche dans votre cercle d'aidants :\n- Vous restez maître des données que vous partagez\n- Vous pouvez révoquer cet accès à tout moment\n- L'aidant s'engage à respecter la confidentialité des informations partagées\n\n## 6. Propriété intellectuelle\n\nL'ensemble des contenus de l'application (textes, graphiques, logos, icônes) sont la propriété de Moodday ou de ses concédants. Toute reproduction est interdite sans autorisation.\n\n## 7. Limitation de responsabilité\n\nMoodday ne peut être tenu responsable :\n- Des décisions médicales prises sur la base des données de l'application\n- Des interruptions temporaires du service\n- Des pertes de données en cas de force majeure\n\nL'application est fournie \"en l'état\" sans garantie d'adéquation à un usage médical particulier.\n\n## 8. Résiliation\n\nVous pouvez supprimer votre compte à tout moment depuis les paramètres. Moodday peut suspendre votre compte en cas de violation des CGU.\n\n## 9. Modifications\n\nMoodday se réserve le droit de modifier ces CGU. Vous serez notifié des changements significatifs par email ou notification dans l'application.\n\n## 10. Droit applicable\n\nLes présentes CGU sont régies par le droit français. Tout litige sera soumis aux tribunaux compétents.\n\n---\n\n*Dernière mise à jour : août 2026*\n\n*Contact : hello@moodday.app*",
    },
    privacy: {
      metaTitle: "{app} - Politique de Confidentialité",
      metaDescription: "Comment Moodday protège vos données de santé mentale",
      title: "Politique de Confidentialité",
      lastUpdated: "Dernière mise à jour : août 2026",
      controller:
        "Responsable du traitement : {publisher}, {legalForm}, SIREN {siren}.",
      intro: {
        prefix: "Votre confidentialité est",
        highlight: "notre priorité.",
        suffix:
          " Nous ne collectons que ce qui est nécessaire pour fournir le service.",
      },
      sections: {
        data: {
          title: "Données collectées",
          highlight:
            "Moodday n’accède pas au carnet d’adresses ni à la localisation précise de l’appareil.",
          items: {
            account: {
              label: "Compte",
              value:
                "E-mail, nom (optionnel) et empreinte sécurisée du mot de passe.",
            },
            daily: {
              label: "Suivi quotidien",
              value: "Humeur, notes, qualité du sommeil.",
            },
            medications: {
              label: "Médicaments",
              value: "Noms, dosages, horaires de prises.",
            },
            therapy: {
              label: "Thérapie",
              value: "Dates de séances et notes (optionnelles).",
            },
          },
        },
        usage: {
          title: "Utilisation des données",
          highlight: "Nous ne vendons jamais vos données.",
          items: {
            service: {
              label: "Fournir le service",
              value: "Suivre l'humeur et les traitements.",
            },
            reports: {
              label: "Générer des rapports",
              value: "Exports PDF pour les consultations.",
            },
            sharing: {
              label: "Partage aidants",
              value: "Uniquement avec votre consentement.",
            },
            improvement: {
              label: "Sécurité et exploitation",
              value: "Événements techniques structurés sans contenu de santé.",
            },
          },
        },
        security: {
          title: "Sécurité",
          items: {
            encryption: {
              label: "Chiffrement",
              value: "Connexions protégées par HTTPS/TLS en transit.",
            },
            hosting: {
              label: "Hébergement",
              value:
                "Sous-traitants et régions documentés dans notre registre.",
            },
            auth: {
              label: "Authentification",
              value: "Sessions sécurisées et fournisseurs OAuth vérifiés.",
            },
            audit: {
              label: "Contrôles",
              value:
                "Autorisations, exports et suppressions testés automatiquement.",
            },
          },
        },
        rights: {
          title: "Vos droits",
          items: {
            access: {
              label: "Accès",
              value: "Consultez toutes vos données à tout moment.",
            },
            rectify: {
              label: "Rectification",
              value: "Mettez à jour vos informations.",
            },
            delete: {
              label: "Effacement",
              value: "Supprimez votre compte et vos données.",
            },
            portability: {
              label: "Portabilité",
              value: "Exportez vos données en JSON.",
            },
          },
        },
      },
      retention: {
        title: "Conservation des données",
        items: {
          active: "Données conservées tant que votre compte est actif.",
          afterDeletion:
            "La suppression du compte déclenche l'effacement des données actives, sous réserve des obligations légales applicables.",
          backups:
            "Les sauvegardes suivent une politique de conservation documentée et contrôlée.",
        },
      },
      cookies: {
        title: "Cookies",
        description:
          "Nous utilisons uniquement des cookies essentiels pour le service.",
        note: "Aucun cookie publicitaire ou de suivi.",
      },
      contact: {
        title: "Contact",
        descriptionPrefix: "Pour les questions de confidentialité, écrivez à ",
      },
      content: `## 1. Objet

Cette politique décrit le traitement des données personnelles par Moodday, compagnon de suivi personnel non médical. Moodday ne pose pas de diagnostic et ne remplace pas un professionnel de santé.

## 2. Données traitées

- **Compte** : adresse email, nom facultatif et données d'authentification.
- **Suivi personnel** : humeur, sommeil, anxiété, énergie et notes que vous choisissez d'enregistrer.
- **Traitements déclarés** : noms, dosages, horaires et prises.
- **Thérapie et exercices** : informations que vous saisissez volontairement.
- **Données techniques minimisées** : informations nécessaires à la sécurité, au diagnostic d'erreurs et au fonctionnement du service. Le contenu sensible est exclu des logs applicatifs.

## 3. Finalités

Ces données servent à fournir le journal, les rappels, les bilans, les exports et les partages que vous activez. Les fonctions d'intelligence artificielle sont désactivées par défaut et soumises à un consentement séparé lorsqu'elles sont disponibles.

Moodday ne vend pas vos données à des annonceurs ou à des assureurs.

## 4. Destinataires et sous-traitants

Vos données peuvent être traitées par les prestataires strictement nécessaires à l'hébergement, aux emails, au paiement et, après consentement, aux fonctions d'IA. La liste contractuelle des sous-traitants, leurs régions et les éventuels transferts internationaux doivent être finalisés avant l'ouverture publique.

Les aidants ne voient que les catégories que vous autorisez. Les notes libres ne sont pas partagées par défaut et l'accès peut être révoqué.

## 5. Sécurité

Les échanges avec l'application utilisent HTTPS. Moodday applique des contrôles d'accès côté serveur, des journaux d'idempotence, des sauvegardes fournisseur et une minimisation des logs. Aucune promesse de chiffrement de bout en bout, de certification HDS, de localisation exclusivement européenne ou de 2FA n'est formulée tant qu'elle n'est pas techniquement et contractuellement démontrée.

## 6. Vos droits

Selon le droit applicable, vous pouvez demander l'accès, la rectification, l'effacement, la portabilité, la limitation ou l'opposition. L'application fournit aussi des exports JSON et CSV et une suppression de compte.

Contact : hello@moodday.app

## 7. Conservation

Les données actives sont conservées pendant la vie du compte. La suppression déclenche l'effacement des données actives, sous réserve des obligations légales applicables. La durée exacte de rétention des sauvegardes et journaux sera publiée après validation contractuelle.

## 8. Cookies

Moodday utilise les cookies essentiels à l'authentification et aux préférences. Aucun cookie publicitaire n'est activé.

## 9. Modifications

Toute modification substantielle de cette politique sera signalée sur le service ou par email.

---

*Dernière mise à jour : août 2026*`,
    },
    cookies: {
      metaTitle: "{app} - Politique de cookies",
      metaDescription:
        "Notre politique de cookies et comment nous les utilisons",
      title: "Politique de cookies",
      description:
        "Comment Moodday utilise les cookies et technologies similaires",
      lastUpdated: "Dernière mise à jour : août 2026",
      intro: {
        title: "Aperçu des cookies",
        descriptionPrefix: "Les cookies aident Moodday à",
        descriptionHighlight: "fonctionner en toute sécurité",
        descriptionSuffix: " et à mémoriser vos préférences.",
      },
      usedTitle: "Cookies que nous utilisons",
      essentialBadge: "Essentiel",
      types: {
        auth: {
          name: "Authentification",
          description: "Vous garde connecté et sécurisé.",
          examples: "Cookie de session Better Auth||État OAuth/PKCE temporaire",
        },
        security: {
          name: "Sécurité",
          description: "Protège les parcours d’authentification sensibles.",
          examples: "Vérification d’origine||Jetons temporaires à usage unique",
        },
        preferences: {
          name: "Préférences",
          description: "Mémorise les préférences d’interface essentielles.",
          examples: "locale||état de la barre latérale",
        },
      },
      notUsed: {
        title: "Cookies que nous n'utilisons pas",
        note: "Nous n'utilisons pas de cookies publicitaires ou de suivi.",
        ads: "Cookies publicitaires",
        tracking: "Cookies de suivi",
        thirdParty: "Cookies marketing tiers",
        social: "Cookies de suivi des réseaux sociaux",
      },
      manage: {
        title: "Gérer les cookies",
        description:
          "Vous pouvez désactiver les cookies dans les paramètres de votre navigateur à tout moment.",
        howToLabel: "Comment faire :",
        howToSteps:
          "Ouvrez les paramètres de votre navigateur et supprimez ou bloquez les cookies.",
      },
      contact: {
        title: "Contact",
        descriptionPrefix: "Des questions ? Écrivez à ",
      },
      sections: [
        {
          title: "Qu'est-ce qu'un cookie ?",
          content:
            "Les cookies sont de petits fichiers texte stockés sur votre appareil lorsque vous visitez un site web. Ils aident les sites à mémoriser vos préférences et à améliorer votre expérience.",
        },
        {
          title: "Comment nous utilisons les cookies",
          content:
            "Moodday utilise uniquement des cookies strictement nécessaires au bon fonctionnement de l'application. Nous utilisons :\n\n• Des cookies d'authentification pour vous garder connecté\n• Des cookies de sécurité pour vous protéger contre la fraude\n• Des cookies de préférences pour mémoriser vos paramètres (langue, thème)",
        },
        {
          title: "Pas de cookies de tracking",
          content:
            "Nous n'utilisons PAS de cookies publicitaires ou de suivi. Nous ne partageons pas vos données avec des annonceurs ou des trackers tiers. Vos données de santé mentale sont privées et le restent.",
        },
        {
          title: "Gérer les cookies",
          content:
            "Vous pouvez gérer les cookies via les paramètres de votre navigateur. Notez que désactiver les cookies essentiels peut affecter le fonctionnement de Moodday.",
        },
        {
          title: "Nous contacter",
          content:
            "Si vous avez des questions sur notre politique de cookies, contactez-nous à hello@moodday.app",
        },
      ],
    },
  },
  error: {
    notFound: {
      title: "Page introuvable",
      description: "Désolé, nous n'avons pas trouvé la page recherchée.",
      explainerTitle: "Que s'est-il passé ?",
      explainerDescription:
        "La page a peut-être été déplacée, supprimée ou l'URL est incorrecte. Si vous pensez devoir y accéder, contactez votre administrateur.",
      cta: "Retour à l'accueil",
    },
    badRequest: {
      title: "Requête invalide",
      description:
        "Nous rencontrons des difficultés techniques. Notre équipe s'en occupe. Essayez d'actualiser la page ou de revenir plus tard.",
      cta: "Retour à l'accueil",
    },
    unauthorized: {
      title: "Non autorisé",
      description:
        "Vous n'avez pas la permission d'accéder à cette ressource. Veuillez vous connecter ou contacter votre administrateur si besoin.",
    },
  },
  offline: {
    metaTitle: "Hors ligne",
    title: "Vous êtes hors ligne",
    description:
      "Certaines fonctionnalités ne sont pas disponibles jusqu'à la reconnexion.",
  },
  landing2: {
    nav: {
      features: "Fonctionnalités",
      security: "Sécurité",
      pricing: "Tarifs",
      guides: "Guides",
      signin: "Connexion",
      startTrial: "Créer un compte",
    },
    footer: {
      description:
        "Consignez vos repères personnels et préparez vos consultations sans diagnostic.",
      links: {
        product: {
          title: "Produit",
          features: "Fonctionnalités",
          pricing: "Tarifs",
          security: "Sécurité",
        },
        resources: {
          title: "Ressources",
          blog: "Blog",
          guides: "Guides",
        },
        company: {
          title: "Entreprise",
          about: "À propos",
          contact: "Contact",
        },
        legal: {
          title: "Légal",
          privacy: "Confidentialité",
          terms: "CGU",
          cookies: "Cookies",
          processors: "Sous-traitants",
        },
      },
      copyright: "© {year} Moodday. Tous droits réservés.",
      status: "Consulter le statut du service",
    },
  },
  guides: {
    metaTitle: "Guides - {app}",
    metaDescription:
      "Guides pratiques pour utiliser les fonctions de suivi personnel de Moodday.",
    title: "Guides Pratiques",
    description:
      "Ressources factuelles pour enregistrer vos repères et utiliser les contrôles disponibles.",
    categories: {
      start: {
        title: "Démarrage",
        description: "Commencez à utiliser Moodday en quelques minutes",
      },
      features: {
        title: "Fonctionnalités",
        description: "Maîtrisez toutes les fonctionnalités de l'application",
      },
      sharing: {
        title: "Partage et sécurité",
        description: "Comprenez les contrôles de confidentialité disponibles",
      },
    },
    cta: {
      title: "Vous ne trouvez pas ce que vous cherchez ?",
      description:
        "Notre équipe est là pour vous aider à tirer le meilleur de Moodday",
      button: "Contactez-nous",
    },
    readMore: "Lire plus",
    items: {
      gettingStarted: {
        title: "Premiers pas",
        description:
          "Apprenez à configurer votre compte et à suivre votre humeur.",
        content:
          "## Créer votre compte\n\n1. **Inscription** - Rendez-vous sur la page d'inscription et utilisez l'une des méthodes effectivement affichées.\n\n2. **Vérification** - Confirmez votre email en cliquant sur le lien reçu dans votre boîte de réception.\n\n## Personnaliser votre profil\n\n- Accédez aux **Paramètres** depuis le menu\n- Ajoutez votre photo et vos informations personnelles\n- Vérifiez votre fuseau horaire et vos préférences d'affichage\n\n## Enregistrer votre première humeur\n\n1. Depuis le tableau de bord, cliquez sur **\"Mon humeur\"**\n2. Utilisez le slider pour indiquer votre niveau d'humeur (0-10)\n3. Ajoutez une note optionnelle pour décrire votre ressenti\n4. Cliquez sur **\"Enregistrer\"**\n\nCette saisie reste un repère personnel et ne constitue pas une évaluation médicale.",
      },
      profile: {
        title: "Configurer votre profil",
        description:
          "Personnalisez votre expérience avec vos préférences et objectifs.",
        content:
          "## Préférences d'affichage\n\n- **Période des graphiques** - Choisissez la période par défaut (7, 30 ou 90 jours)\n- **Thème** - Sélectionnez le mode clair, sombre ou automatique\n- **Fuseau horaire** - Vérifiez le fuseau utilisé pour vos journées civiles\n\n## Paramètres de confidentialité\n\n- Consultez les consentements et fonctions actuellement disponibles\n- Contrôlez les informations incluses dans vos exports",
      },
      moodTracking: {
        title: "Suivi de l'humeur",
        description:
          "Apprenez à enregistrer et analyser vos variations d'humeur quotidiennes.",
        content:
          "## Enregistrer votre humeur\n\n1. **Le slider 0-10** - Utilisez l'échelle intuitive pour indiquer votre niveau d'humeur\n   - 0-3 : Humeur basse\n   - 4-6 : Humeur neutre\n   - 7-10 : Bonne humeur\n\n2. **Les notes** - Ajoutez du contexte à vos entrées pour mieux relire votre période\n\n## Analyser vos tendances\n\n- Consultez vos **graphiques** sur 7, 30 ou 90 jours\n- Comparez vos repères déclarés sans en déduire de cause\n- Préparez vos propres questions pour une consultation\n\n## Modifier ou supprimer une entrée\n\n- Cliquez sur une entrée dans l'historique\n- Utilisez le bouton **\"Modifier\"** pour ajuster l'humeur ou la note\n- Utilisez **\"Supprimer\"** si vous souhaitez retirer une entrée",
      },
      medications: {
        title: "Gérer ses médicaments",
        description:
          "Comment ajouter un traitement déclaré et enregistrer vos prises.",
        content:
          '## Ajouter un médicament\n\n1. Allez dans **"Traitements"** depuis le menu\n2. Cliquez sur **"Ajouter un médicament"**\n3. Renseignez le nom, le dosage et la fréquence\n4. Activez l\'option **PRN** si vous le prenez aussi "si besoin"\n\n## Enregistrer vos prises\n\n- Chaque jour, marquez vos médicaments comme pris\n- Pour les PRN, utilisez le bouton **"Prendre"** et ajoutez une raison optionnelle\n- Consultez votre historique de prises dans le détail du médicament\n\n## Historique des dosages\n\n- Lors d\'un changement de dosage, le système garde un historique\n- Relisez les changements à côté de vos repères, sans en déduire de cause\n\n## Archiver un médicament\n\n- Quand vous arrêtez un traitement, archivez-le plutôt que de le supprimer\n- L\'historique est conservé pour préparer vos consultations',
      },
      reports: {
        title: "Rapports et statistiques",
        description:
          "Générez des rapports PDF pour vos consultations médicales.",
        content:
          '## Générer un export PDF\n\n1. Allez dans **"Export"** depuis le menu Outils\n2. Sélectionnez la période (2 semaines, 1 mois, 3 mois ou personnalisée)\n3. Cliquez sur **"Aperçu"** pour voir le contenu\n4. Téléchargez le PDF avec **"Télécharger PDF"**\n\n## Contenu du rapport\n\n- **Repères d\'humeur et de sommeil** sur la période sélectionnée\n- **Statistiques** : moyenne, évolution et nombre d\'entrées\n- **Traitements déclarés** : liste, changements et adhérence expliquée\n- **Séances de thérapie** enregistrées\n\n## Utiliser le rapport\n\n- Imprimez-le ou transmettez-le vous-même par le canal de votre choix\n- Moodday ne l\'envoie pas automatiquement à un professionnel\n\n## Export de compte\n\n- Dans **Paramètres > Confidentialité**, téléchargez vos données au format JSON\n- Consultez la politique de confidentialité pour exercer vos droits',
      },
      caregivers: {
        title: "Cercle d'aidants",
        description: "Partagez votre évolution avec vos proches de confiance.",
        content:
          "## Inviter un aidant\n\n1. Accédez à **\"Suivi aidant\"** depuis le menu\n2. Entrez l'email de la personne à inviter\n3. Définissez les permissions, les fenêtres de 7, 30 ou 90 jours et une expiration facultative\n\n## Ce que vos aidants peuvent voir\n\n- **Tendances d'humeur** générales, sans notes\n- **Traitements actifs et adhérence agrégée**, sans notes de prise\n- **Contributions** uniquement avec la permission correspondante\n\n## Ce qui reste privé\n\n- Vos notes personnelles\n- Les détails de vos séances de thérapie\n- Le contenu de vos entrées quotidiennes\n\n## Gérer les accès\n\n- Révoquez l'accès d'un aidant à tout moment\n- Modifiez les permissions et fenêtres selon vos besoins\n- Consultez le journal des accès et activez un digest quotidien ou hebdomadaire",
      },
      privacy: {
        title: "Confidentialité & Sécurité",
        description:
          "Consultez les contrôles d'accès, d'export et de suppression disponibles.",
      },
    },
  },
};

export default fr;
