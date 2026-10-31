import type en from "./en";

const fr: typeof en = {
  meta: {
    title: "Moodday",
    description:
      "Le SPM, ça se traverse à deux. Elle fait son point en dix secondes, son ou sa partenaire répond par un geste. Journal de bien-être sans diagnostic.",
  },
  language: {
    title: "Langue",
    toggleLabel: "Changer de langue",
    current: "Langue actuelle",
    fr: "Français",
    en: "Anglais",
  },
  nav: {
    dashboard: "Aujourd’hui",
    backToSite: "Retour au site",
  },
  footer: {
    terms: "Conditions",
    privacy: "Confidentialité",
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
      "Suis le cercle : inspire, retiens, expire. Recommence quelques fois, à ton rythme.",
  },
  crisis: {
    metaTitle: "Besoin d’aide maintenant",
    metaDescription:
      "3114, 15, 112 et 114 : les numéros d’urgence gratuits en France, et une respiration guidée pour les moments difficiles.",
    title: "Besoin d’aide maintenant",
    subtitle:
      "Si tu ne te sens pas en sécurité, ou si tu t’inquiètes pour quelqu’un, parle à quelqu’un maintenant. Ces numéros sont gratuits.",
    primary: {
      kicker: "En premier",
      title: "3114 · Numéro national de prévention du suicide",
      description:
        "Si tu penses au suicide, si tu n’en peux plus, ou si tu t’inquiètes pour ta ou ton partenaire : des professionnels répondent, gratuitement, 24 h/24 et 7 j/7.",
      cta: "Appeler le 3114",
    },
    emergency: {
      title: "Danger immédiat",
      description:
        "Si une vie est en danger maintenant, appelle les secours. Si tu ne peux pas parler, envoie un SMS au 114.",
    },
    sections: {
      hotlines: "Lignes d’écoute",
      emergency: "Services d’urgence",
      support: "Autres soutiens",
    },
    breathing: {
      title: "Respirer un moment",
      badge: "Respiration 4-7-8",
      description:
        "Si l’angoisse monte, ce cercle peut t’aider à ralentir. Ça ne remplace pas un appel.",
    },
    partner: {
      title: "Tu t’inquiètes pour ta ou ton partenaire",
      items: [
        "Reste avec elle ou lui, ou reste joignable.",
        "Tu peux poser la question directement : « Est-ce que tu penses au suicide ? » En parler n’augmente pas le risque.",
        "Appelez le 3114 ensemble, ou appelle-le de ton côté pour savoir comment aider.",
        "Si le danger est immédiat, appelle le 15 ou le 112.",
      ],
    },
    reassurance: {
      title: "Tu n’es pas seul·e",
      emphasis: "Une aide existe, maintenant.",
      body: "Demander de l’aide n’est ni un échec ni un dérangement. C’est un premier pas.",
    },
    disclaimer:
      "Moodday n’est pas un service d’urgence et ne surveille pas tes points. Ces numéros restent gratuits et accessibles sans compte.",
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
        name: "3114 · Prévention du suicide",
        description:
          "Numéro national, gratuit, pour toi ou pour un proche qui t’inquiète.",
        availability: "24 h/24, 7 j/7",
      },
      sosAmitie: {
        name: "SOS Amitié",
        description: "Écoute anonyme pour les personnes en détresse.",
        availability: "Voir le site pour les horaires",
      },
      filSanteJeunes: {
        name: "Fil Santé Jeunes",
        description: "Écoute et information pour les 12-25 ans.",
        availability: "Voir le site pour les horaires",
      },
      samu: {
        name: "SAMU",
        description: "Urgence médicale, 24 h/24.",
        availability: "Service d'urgence",
      },
      europeanEmergency: {
        name: "112 · Numéro d’urgence européen",
        description:
          "Numéro d’urgence gratuit, joignable depuis tout téléphone dans l’Union européenne.",
        availability: "24 h/24, 7 j/7",
      },
      deafEmergency: {
        name: "114 · Urgences par SMS",
        description:
          "Pour les personnes sourdes, malentendantes ou ne pouvant pas parler : SMS, visio ou tchat.",
        availability: "24 h/24, 7 j/7",
      },
      suicideEcoute: {
        name: "Suicide Écoute",
        description: "Écoute pour les personnes confrontées au suicide.",
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
    profile: {
      title: "Profil",
      defaultName: "Votre nom",
      changePhoto: "Changer la photo",
      fullName: "Nom complet",
      fullNamePlaceholder: "Votre nom complet",
      timezone: "Fuseau horaire",
      save: "Enregistrer le profil",
    },
    notifications: {
      title: "Notifications",
      enabled: "Activer les notifications",
      enabledHint: "Recevoir les rappels et les gestes de ton duo",
      permissionDenied:
        "L’autorisation de notification n’a pas été accordée. Vous pouvez la modifier dans les réglages du navigateur.",
      dailyCheckIn: "Rappel quotidien",
      dailyCheckInHint: "Un petit rappel pour faire ton point",
      checkInTime: "Heure du rappel",
    },
    appearance: {
      title: "Apparence",
      themeLabel: "Thème",
    },
    security: {
      description:
        "Gérez vos informations de connexion et protégez votre compte.",
    },
    timezones: {
      paris: "Paris",
      london: "Londres",
      newYork: "New York",
    },
    saved: "Paramètres sauvegardés !",
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
    checkoutCanceled: {
      title: "Paiement annulé",
      description:
        "Pas de souci — vous pourrez changer d'offre quand vous le souhaitez.",
      back: "Retour aux tarifs",
    },
  },
  plans: {
    names: {
      free: "Gratuit",
      plus: "Duo",
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
      goDashboard: "Revenir à aujourd’hui",
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
  },
  auth: {
    notSignedIn: "Connecte-toi pour continuer.",
    form: {
      name: "Nom",
      email: "E-mail",
      emailPlaceholder: "toi@exemple.fr",
      password: "Mot de passe",
    },
    signIn: {
      metaTitle: "Se connecter à {app}",
      metaDescription:
        "Retrouve ton point du jour, ton duo et le Programme Allié.",
      title: "Se connecter",
      description:
        "Content de te revoir. Connecte-toi pour retrouver ton espace.",
      emailPlaceholder: "toi@exemple.fr",
      forgotPassword: "Mot de passe oublié ?",
      submit: "Se connecter",
      magicLinkSubmit: "Envoyer le lien magique",
      magicLinkPrompt: "Plutôt un lien magique ?",
      magicLinkAction: "Utiliser un lien magique",
      passwordPrompt: "Plutôt un mot de passe ?",
      passwordAction: "Utiliser un mot de passe",
      noAccount: "Pas encore de compte ?",
      signUp: "Créer un compte",
      registrationClosed:
        "Les inscriptions sont temporairement fermées pendant la bêta privée.",
      or: "ou",
      lastUsed: "Dernier utilisé",
      provider: "Continuer avec {provider}",
      providerErrors: {
        accessDenied:
          "Connexion annulée. Tu peux réessayer ou utiliser ton e-mail.",
        signupClosed:
          "Aucun compte Moodday n’est associé à cette adresse. Les inscriptions sont fermées pendant la bêta privée : rejoins la liste d’attente pour être prévenu·e de l’ouverture.",
        signupInviteRequired:
          "Cette adresse n’est pas encore invitée à la bêta privée. Utilise l’adresse qui a reçu l’invitation, ou rejoins la liste d’attente.",
        generic:
          "Le fournisseur n’a pas pu terminer la connexion. Réessaie ou utilise ton e-mail.",
        joinWaitlist: "Rejoindre la liste d’attente",
      },
    },
    signUp: {
      metaTitle: "Créer ton compte {app}",
      metaDescription:
        "Crée ton compte Moodday : ton point du jour, ton duo, le Programme Allié.",
      title: "Créer ton compte {app}",
      description:
        "Un compte gratuit, deux minutes, et c’est parti. Que ce soit ton cycle ou celui de ta ou ton partenaire.",
      closedTitle: "Moodday se prépare en petit comité",
      closedDescription:
        "Les nouveaux comptes sont fermés le temps de terminer la bêta privée. Si tu as déjà un compte, tu peux continuer à te connecter.",
      inviteDescription:
        "Cette bêta est accessible sur invitation. Utilise l’adresse e-mail avec laquelle tu as été invité·e.",
      namePlaceholder: "Ton prénom",
      emailPlaceholder: "toi@exemple.fr",
      verifyPassword: "Confirmer le mot de passe",
      passwordMismatch: "Les mots de passe ne correspondent pas",
      ageConsent: "Je confirme avoir au moins 18 ans.",
      termsConsent: "J’accepte les",
      privacyConsent: "J’ai lu et j’accepte la",
      healthDataConsent:
        "Je consens explicitement au traitement de mes données de cycle et de bien-être (dates de règles, point du jour, symptômes, besoins, note privée) uniquement pour faire fonctionner mon compte Moodday et le partage que je choisis. Le service ne peut pas fonctionner sans ce traitement.",
      submit: "Créer un compte",
      hasAccount: "Tu as déjà un compte ?",
      signIn: "Se connecter",
      validation: {
        nameRequired: "Ton prénom est requis",
        emailInvalid: "Saisis une adresse e-mail valide",
        passwordMin: "Le mot de passe doit contenir au moins 8 caractères",
        verifyPasswordMin:
          "La confirmation doit contenir au moins 8 caractères",
        passwordMismatch: "Les mots de passe ne correspondent pas",
        ageRequired: "Moodday est réservé aux personnes de 18 ans ou plus.",
        termsRequired: "Il faut accepter les conditions pour continuer.",
        privacyRequired:
          "Il faut accepter la politique de confidentialité pour continuer.",
        healthDataConsentRequired:
          "Ton consentement explicite au traitement de tes données de cycle et de bien-être est nécessaire pour utiliser Moodday.",
      },
    },
    forgetPassword: {
      metaTitle: "Réinitialiser ton mot de passe {app}",
      metaDescription: "On t’envoie un lien de réinitialisation.",
      title: "Mot de passe oublié ?",
      description:
        "Saisis ton e-mail pour recevoir un lien de réinitialisation.",
      submit: "Envoyer le lien",
    },
    resetPassword: {
      metaTitle: "Choisir un nouveau mot de passe",
      metaDescription: "Choisis un nouveau mot de passe pour ton compte.",
      title: "Définir un nouveau mot de passe",
      description: "Choisis un mot de passe solide.",
      newPassword: "Nouveau mot de passe",
      passwordPlaceholder: "Au moins 8 caractères",
      passwordMin: "Le mot de passe doit contenir au moins 8 caractères",
      submit: "Mettre à jour",
      success: "Mot de passe mis à jour",
    },
    confirmDelete: {
      metaTitle: "Confirmer la suppression du compte",
      metaDescription: "Confirme la suppression de ton compte.",
      title: "Confirmer la suppression du compte",
      description: "Cette action est irréversible.",
      confirm: "Supprimer le compte",
      invalidToken: "Jeton invalide ou expiré",
    },
    newUser: {
      metaTitle: "Bienvenue sur {app}",
      metaDescription: "Ton compte est prêt.",
      title: "Tout est prêt !",
      description:
        "Ton compte est prêt. Prochaine étape : ton premier point, ou le Programme Allié.",
      cta: "C’est parti",
    },
    goodbye: {
      metaTitle: "Déconnecté de {app}",
      metaDescription: "Tu es déconnecté·e.",
      title: "Tu es déconnecté·e",
      description: "À bientôt. La bouillotte reste au chaud.",
      detailOne: "Tu peux te reconnecter quand tu veux.",
      detailTwo: "Besoin d’un nouveau compte ? Ça prend deux minutes.",
      cta: "Créer un compte",
    },
    verify: {
      metaTitle: "Vérifie ton e-mail",
      metaDescription:
        "Regarde ta boîte de réception pour vérifier ton e-mail.",
      title: "Vérifie ton e-mail",
      description: "On t’a envoyé un lien de vérification.",
      checkInbox: "Regarde ta boîte de réception",
      instructions: "Clique sur le lien de l’e-mail pour vérifier ton adresse.",
      spamHelp: "Rien ? Jette un œil aux spams.",
      support: "Besoin d’aide ? Écris au support.",
      resendLabel: "E-mail utilisé à l'inscription",
      resendSubmit: "Renvoyer le lien",
      resendCooldown: "Nouvel envoi possible dans {seconds} s",
      resendSent:
        "Si un compte non vérifié utilise cette adresse, un nouveau lien est en route. Il expire dans une heure.",
      resendFailed:
        "L’e-mail n’a pas pu partir. Réessaie dans quelques minutes ou écris au support.",
    },
    error: {
      message: "Une erreur est survenue",
    },
    logout: "Se déconnecter",
  },
  form: {
    unsavedWarning:
      "Tu as des modifications non enregistrées. Tu veux vraiment quitter ?",
  },
  posts: {
    metaTitle: "Guides {app}",
    metaDescription:
      "Des guides clairs sur le SPM, le TDPM et la vie de couple pendant le cycle. Sans jugement, sans diagnostic.",
    title: "Guides",
    emptyTitle: "Aucun guide pour l’instant",
    viewAll: "Voir tous les guides",
    back: "Retour",
    draft: "Brouillon",
    publishedBy: "Publié {date}",
    readingTime: "Lecture {minutes} min",
    createdBy: "Écrit par",
    category: {
      title: "Guides : {category}",
      metaTitle: "Guides {app} : {category}",
    },
    notFound: {
      title: "Guide introuvable",
      description: "Ce guide n’existe pas, ou plus.",
    },
    error: {
      title: "Ce guide n’a pas pu s’afficher",
      description: "Désolé, ça coince de notre côté. Réessaie dans un moment.",
    },
  },
  about: {
    metaTitle: "À propos de {app}",
    metaDescription:
      "Pourquoi Moodday existe : aider les couples à traverser le SPM et le TDPM, sans diagnostic et sans que personne n’ait à deviner.",
    hero: {
      kicker: "À propos",
      titlePrefix: "On a fait Moodday pour que personne",
      titleHighlight: "n’ait à deviner.",
      description:
        "Chaque mois, le SPM ou le TDPM s’invite dans beaucoup de couples. Elle n’a pas envie de tout expliquer. Son ou sa partenaire ne sait pas quoi faire. Moodday leur donne un langage commun : un point de dix secondes, un geste en retour.",
    },
    mission: {
      title: "Ce que fait Moodday",
      paragraphOne:
        "Celle dont c’est le cycle fait « Mon point » : Ça va, Fragile, Difficile ou Très dur, quelques symptômes si elle veut, un ou deux besoins. Sa note reste privée, toujours.",
      paragraphTwo:
        "Celui ou celle qui soutient reçoit une notification neutre et répond par un geste, en un tap. Le Programme Allié lui explique, en 7 leçons de 2 minutes, ce qui se passe vraiment.",
    },
    vision: {
      title: "Ce que Moodday ne fera jamais",
      paragraphOne:
        "Poser un diagnostic, conseiller un traitement ou deviner l’humeur de quelqu’un à partir d’un calendrier. Moodday est un journal descriptif, hors dispositif médical.",
      paragraphTwo:
        "Vendre tes données, afficher de la publicité ou faire payer les ressources de crise.",
    },
    values: {
      title: "Nos trois règles",
      items: {
        control: {
          title: "Elle décide",
          description:
            "Elle est la seule source de ses données. Son ou sa partenaire ne saisit rien sur elle, et elle choisit ce qui est partagé.",
        },
        together: {
          title: "Aider sans tout prendre en charge",
          description:
            "Le partenaire propose, écoute, fait un geste. Personne n’a à porter le cycle de l’autre à sa place.",
        },
        sober: {
          title: "Zéro diagnostic",
          description:
            "On décrit, on ne juge pas. Le diagnostic, c’est le travail des professionnels de santé.",
        },
      },
    },
    team: {
      title: "Une petite équipe indépendante",
      description:
        "Une question, une idée, une critique ? On lit tout, et on répond les jours ouvrés.",
      contactCta: "Nous écrire",
    },
    privacyPromise: {
      title: "Gratuit pour l’essentiel",
      description:
        "Le partage de base, les ressources de crise (3114, 15, 112, 114), l’export et la suppression de tes données restent gratuits. L’abonnement Duo ajoute du confort, il n’enlève rien.",
    },
  },
  contact: {
    metaTitle: "Contact {app}",
    metaDescription:
      "Écris à l’équipe Moodday pour une question sur ton compte, ton duo, tes données ou le produit.",
    title: "Nous écrire",
    description:
      "Une question sur Moodday, ton compte ou ton duo ? On est là. N’envoie pas le contenu de tes points ni d’information médicale.",
    cards: {
      email: {
        title: "Par e-mail",
        description:
          "Pour une question sur le produit, ton compte ou tes données.",
      },
      response: {
        title: "Délai de réponse",
        description: "On répond les jours ouvrés, au mieux.",
        value: "Aucun délai contractuel",
      },
      social: {
        title: "Réseaux sociaux",
        description: "Les nouvelles de Moodday.",
      },
    },
    form: {
      title: "Envoyer un message",
      subtitle: "On te répond dès que possible.",
      firstName: "Prénom",
      lastName: "Nom",
      email: "E-mail",
      subject: "Sujet",
      message: "Message",
      submit: "Envoyer le message",
      success: "Ton message est parti",
      invalid: "Champ invalide",
    },
    faq: {
      title: "Questions fréquentes",
      items: {
        free: {
          question: "Moodday est-il gratuit ?",
          answer:
            "Oui pour l’essentiel : le point du jour, le partage avec ton duo, les gestes, le Programme Allié et les ressources de crise. L’abonnement Duo (4,99 € par mois ou 34,99 € par an, pour deux comptes) ouvrira après la bêta.",
        },
        security: {
          question: "Mon ou ma partenaire voit-il tout ?",
          answer:
            "Non. Tu choisis ce qui est partagé, avec un aperçu exact. Ta note du jour reste privée, toujours. Tu peux mettre le partage en pause ou l’arrêter quand tu veux.",
        },
        export: {
          question: "Puis-je récupérer ou supprimer mes données ?",
          answer:
            "Oui. Depuis tes réglages, tu peux télécharger une copie de tes données et supprimer ton compte.",
        },
      },
      more: "Encore une question ? Écris-nous.",
    },
  },
  legal: {
    terms: {
      metaTitle: "{app} - Conditions générales d’utilisation",
      metaDescription:
        "Conditions générales d’utilisation de Moodday, l’application de couple pour traverser le SPM et le TDPM.",
      title: "Conditions générales d’utilisation",
      subtitle:
        "Ce que Moodday fait, ce qu’il ne fait pas, et les règles du jeu pour l’utiliser à deux en toute confiance.",
      lastUpdated: "Dernière mise à jour : octobre 2026",
      emergency: {
        title: "En cas d’urgence",
        descriptionPrefix:
          "Moodday n’est pas un service d’urgence. Si vous pensez au suicide ou vous inquiétez pour quelqu’un, appelez le ",
        phone: "3114",
        descriptionSuffix:
          " (gratuit, 24 h/24). En cas de danger immédiat, appelez le 15 ou le 112, ou envoyez un SMS au 114.",
      },
      contact: {
        title: "Des questions ?",
        descriptionPrefix: "Écrivez-nous à ",
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
            "Moodday aide les couples à traverser le syndrome prémenstruel (SPM) et le trouble dysphorique prémenstruel (TDPM). La personne dont c’est le cycle enregistre son point du jour (état, symptômes facultatifs, besoins, note privée) et choisit ce qu’elle partage. Son ou sa partenaire peut répondre par un geste et suivre le Programme Allié, un contenu éducatif.",
          highlight:
            "Moodday est un journal de bien-être descriptif. Ce n’est pas un dispositif médical : il ne pose aucun diagnostic, ne prédit pas l’humeur et ne remplace pas un professionnel de santé.",
        },
        account: {
          title: "Compte et éligibilité",
          items: {
            age: "Vous devez avoir au moins 18 ans et résider en France pendant ce lancement.",
            accurateInfo: "Fournissez des informations d’inscription exactes.",
            credentials: "Gardez vos identifiants confidentiels.",
            responsibility:
              "Vous êtes responsable de l’activité de votre compte.",
          },
        },
        acceptableUse: {
          title: "Utilisation acceptable",
          items: {
            personalTracking:
              "Seule la personne dont c’est le cycle renseigne ses propres données. Le partenaire ne saisit rien à sa place.",
            noSharing:
              "Ne partagez pas vos identifiants et n’utilisez pas le compte de quelqu’un d’autre.",
            noBypass:
              "N’essayez pas de contourner les mesures de sécurité ou les choix de partage.",
            respect:
              "N’utilisez pas Moodday pour surveiller, contrôler ou faire pression sur quelqu’un.",
          },
        },
        partner: {
          title: "Partage à deux",
          content:
            "Le partage avec un ou une partenaire repose sur une invitation acceptée par les deux comptes. La personne dont c’est le cycle choisit ce qui est visible et peut mettre en pause ou arrêter le partage à tout moment, sans justification. La note privée n’est jamais partagée. Chacun peut quitter le duo quand il le souhaite.",
        },
        subscription: {
          title: "Offre gratuite et abonnement Duo",
          content:
            "L’essentiel de Moodday est gratuit, dont le partage de base et les ressources de crise. L’abonnement Duo (4,99 € par mois ou 34,99 € par an) couvre deux comptes liés. Il n’est pas ouvert pendant la bêta ; ses conditions seront présentées avant toute souscription.",
        },
        ip: {
          title: "Propriété intellectuelle",
          content:
            "Les textes, illustrations (dont la mascotte Bouyotte), le Programme Allié et la marque appartiennent à Moodday ou à ses concédants.",
        },
        liability: {
          title: "Limitation de responsabilité",
          items: {
            decisions:
              "Les contenus de Moodday sont éducatifs. Ils ne constituent pas un avis médical et Moodday n’est pas responsable des décisions de santé prises sur leur base.",
            interruptions: "Des interruptions de service peuvent survenir.",
            losses:
              "Nous ne sommes pas responsables des pertes de données hors de notre contrôle.",
          },
          highlight: "Le service est fourni « en l’état », pendant une bêta.",
        },
        termination: {
          title: "Résiliation",
          content:
            "Vous pouvez supprimer votre compte à tout moment depuis les réglages. Le partage avec votre partenaire s’arrête alors immédiatement.",
        },
        law: {
          title: "Droit applicable",
          content: "Ces conditions sont régies par le droit français.",
        },
      },
    },
    privacy: {
      metaTitle: "{app} - Politique de Confidentialité",
      metaDescription:
        "Comment Moodday protège vos données de cycle et de bien-être, et ce que votre partenaire peut voir.",
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
              label: "Point du jour",
              value:
                "État du jour, symptômes facultatifs, besoins et note privée (jamais partagée).",
            },
            medications: {
              label: "Cycle",
              value:
                "Dates de règles que vous saisissez et repères calculés à partir d’elles.",
            },
            therapy: {
              label: "Duo",
              value:
                "Lien avec votre partenaire, réglages de partage, gestes et progression du Programme Allié.",
            },
          },
        },
        usage: {
          title: "Utilisation des données",
          highlight: "Nous ne vendons jamais vos données.",
          items: {
            service: {
              label: "Fournir le service",
              value:
                "Faire fonctionner votre journal, votre calendrier et votre duo.",
            },
            reports: {
              label: "Notifications",
              value:
                "Prévenir votre partenaire de façon neutre, sans détail visible sur l’écran verrouillé.",
            },
            sharing: {
              label: "Partage avec votre partenaire",
              value:
                "Uniquement ce que la personne dont c’est le cycle choisit, révocable à tout moment.",
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
};

export default fr;
