import type en from "./en";

const fr: typeof en = {
  meta: {
    title: "Moodday",
    description: "Boilerplate Next.js moderne avec auth, paiements et plus",
  },
  language: {
    title: "Langue",
    toggleLabel: "Changer de langue",
    current: "Langue actuelle",
    fr: "Français",
    en: "English",
  },
  nav: {
    docs: "Docs",
    about: "À propos",
    contact: "Contact",
    features: "Fonctionnalités",
    pricing: "Tarifs",
    blog: "Blog",
    changelog: "Historique",
    menu: "Menu",
    toggleMenu: "Basculer le menu de navigation",
    logoAlt: "Logo de l'application",
    home: "Accueil",
    analytics: "Analyses",
    dashboard: "Tableau de bord",
    organization: "Organisation",
    account: "Compte",
    app: "App",
  },
  footer: {
    description:
      "Boilerplate Next.js moderne pour construire des applications SaaS.",
    product: "Produit",
    blog: "Blog",
    documentation: "Documentation",
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
  },
  common: {
    error: "Une erreur est survenue",
    saving: "Enregistrement...",
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
    },
    frequency: {
      daily: "Une fois par jour",
      twiceDaily: "Deux fois par jour",
      weekly: "Une fois par semaine",
      prn: "Si besoin (PRN)",
    },
    list: {
      title: "Mes médicaments",
      empty:
        "Pas encore de médicaments. Ajoute ton premier médicament pour commencer !",
      addNew: "Ajouter un médicament",
      archived: "Médicaments archivés",
      showArchived: "Voir archivés",
      hideArchived: "Masquer archivés",
      takenToday: "Pris aujourd'hui",
      notTaken: "Pas encore pris",
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
      logged: "Prise PRN enregistrée !",
      takenToday: "{count}x aujourd'hui",
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
    },
    dosageHistory: {
      title: "Historique des dosages",
    },
    intake: {
      logged: "Médicament pris !",
      skipped: "Médicament sauté",
      undone: "Prise annulée",
      undo: "Annuler",
      skip: "Sauter aujourd'hui",
    },
    today: {
      title: "Médicaments du jour",
      subtitle: "Marque tes médicaments comme pris",
      empty: "Pas de médicaments réguliers. Ajoute-en un pour commencer !",
      allDone: "Tout est pris pour aujourd'hui !",
      progress: "{taken} sur {total} pris",
    },
  },
  mood: {
    entry: {
      title: "Comment te sens-tu ?",
      editTitle: "Modifier ton humeur",
      notePlaceholder: "Ajoute une note (optionnel)...",
      save: "Enregistrer mon humeur",
      saved: "Humeur enregistrée !",
      update: "Modifier",
      updated: "Humeur modifiée !",
      delete: "Supprimer",
      deleted: "Entrée supprimée",
      deleteTitle: "Supprimer cette entrée ?",
      deleteDescription:
        "Cette action est irréversible. Ton entrée d'humeur sera définitivement supprimée.",
      deleteConfirm: "Oui, supprimer",
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
    monthly: "Mensuel",
    yearly: "Annuel",
    save: "Économisez {percent}",
    footer: "Annulez à tout moment. Aucun frais caché.",
    customPlan: "Besoin d'une offre sur mesure ?",
    contact: "Contactez-nous",
    dialog: {
      title: "Choisissez une offre et lancez-vous",
      description:
        "Débloquez toutes les fonctionnalités et faites grandir votre activité.",
    },
  },
  pricingCard: {
    mostPopular: "Le plus populaire",
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
  },
  plans: {
    names: {
      free: "Gratuit",
      pro: "Pro",
      ultra: "Ultra",
    },
    descriptions: {
      free: "Parfait pour les particuliers et les petits projets",
      pro: "Idéal pour les équipes en croissance avec des besoins avancés",
      ultra: "Offre entreprise pour grandes équipes et workflows complexes",
    },
    limits: {
      projects: {
        label: "{value} projets",
        description: "Créer et gérer des projets",
      },
      storage: {
        label: "{value} Go de stockage",
        description: "Stockage cloud pour vos fichiers",
      },
      members: {
        label: "{value} membres d'équipe",
        description: "Inviter des membres pour collaborer",
      },
    },
    additionalFeatures: {
      free: [
        {
          label: "Sécurité de base",
          description: "Protection standard pour vos données",
        },
      ],
      pro: [
        {
          label: "Support prioritaire",
          description: "Obtenez de l'aide quand vous en avez besoin",
        },
        {
          label: "Service client 24/7",
          description: "Assistance disponible à toute heure",
        },
        {
          label: "Analyses avancées",
          description: "Insights détaillés et rapports",
        },
      ],
      ultra: [
        {
          label: "Support prioritaire",
          description: "Obtenez de l'aide quand vous en avez besoin",
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
      section: "Admin",
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
        admin: "Admin",
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
          active: "Active",
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
      mail: "Email",
      danger: "Danger",
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
      cancelTitle: "Annuler l'abonnement",
      cancelDescription:
        "Dites-nous pourquoi vous partez pour nous aider à améliorer.",
      cancelReasonLabel: "Raison de l'annulation",
      cancelDetailsLabel: "Détails supplémentaires",
      cancelDetailsPlaceholder: "Dites-nous en plus...",
      cancelDetailsMin: "Merci d'ajouter plus de détails",
      cancelConfirm: "Confirmer l'annulation",
      cancelBack: "Conserver l'abonnement",
      cancelError: "Impossible d'annuler l'abonnement",
      cancelRedirect: "Redirection vers le portail de facturation...",
      cancelReasons: {
        tooExpensive: "Trop cher",
        notUsing: "Pas assez utilisé",
        missingFeatures: "Fonctionnalités manquantes",
        bugs: "Trop de bugs",
        competitor: "Passage à un concurrent",
        other: "Autre",
      },
      detailsTitle: "Détails de facturation",
      limitsTitle: "Limites du plan",
      plan: "Plan",
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
    form: {
      name: "Nom",
      email: "Email",
      emailPlaceholder: "vous@exemple.com",
      password: "Mot de passe",
    },
    signIn: {
      metaTitle: "Se connecter à {app}",
      metaDescription: "Accédez à votre compte pour gérer vos témoignages.",
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
      submit: "Créer un compte",
      hasAccount: "Vous avez déjà un compte ?",
      signIn: "Se connecter",
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
  landing: {
    hero: {
      titlePrefix: "Lancez votre SaaS",
      titleHighlight: "en jours, pas en mois",
      description:
        "Un boilerplate Next.js moderne avec authentification, paiements, emails et base de données - tout ce qu'il faut pour lancer rapidement.",
      ctaPrimary: "Commencer",
      ctaSecondary: "Voir les fonctionnalités",
      imageAlt: "Capture d'écran du tableau de bord",
    },
    stats: {
      one: "Heures économisées",
      two: "Développeurs actifs",
      three: "Projets lancés",
      four: "Temps de setup",
    },
    bento: {
      avatarAlt: "Avatar",
      items: {
        ai: {
          title: "Authentification",
          description:
            "Auth multi-provider avec GitHub, Google et magic links.",
        },
        schedule: {
          title: "Paiements",
          description:
            "Intégration Stripe avec abonnements et portail de facturation.",
        },
        calendar: {
          title: "Base de données",
          description: "PostgreSQL avec Prisma ORM et support multi-tenant.",
        },
        analytics: {
          title: "Email",
          description: "Emails transactionnels avec React Email et Resend.",
        },
        research: {
          title: "Organisations",
          description: "Support multi-tenant avec rôles et permissions.",
        },
      },
      skeleton: {
        threadPrompt: "Créer votre premier projet",
        threadResponse:
          "Votre projet Moodday est prêt ! Commencez à construire votre SaaS en minutes.",
        schedulePending: "Configuration de votre environnement...",
        scheduleSuccess:
          "Votre serveur de développement tourne sur localhost:3000",
        researchQuestion: "Quelle stack utilise Moodday ?",
        searching: "Chargement...",
        researchAnswer:
          "Next.js 16, TypeScript, TailwindCSS, Prisma, Better Auth et Stripe.",
      },
      stats: {
        followers: "+{count} fonctionnalités",
        views: "+{count} composants",
        likes: "{count} téléchargements",
        replies: "{count} étoiles",
        last30Days: "Inclus par défaut",
      },
    },
    features: {
      badge: "Tout est inclus.",
      title: "Construisez plus vite avec une stack",
      titleEmphasis: "complète",
      description:
        "Tout ce qu'il faut pour lancer une application SaaS prête pour la production.",
      items: [
        {
          badge: "Auth",
          title: "Authentification prête",
          description: "Connexion via GitHub, Google ou magic links incluse.",
        },
        {
          badge: "Paiements",
          title: "Intégration Stripe",
          description:
            "Abonnements, webhooks et portail client déjà configurés.",
        },
        {
          badge: "Database",
          title: "PostgreSQL + Prisma",
          description:
            "Accès base de données type-safe avec migrations et scripts de seed.",
        },
        {
          badge: "Email",
          title: "Emails transactionnels",
          description:
            "Templates d'emails avec React Email et intégration Resend.",
        },
      ],
    },
    pain: {
      title: "J'adore construire des produits SaaS...",
      subtitle: "Mais la mise en place prend une éternité",
      without: {
        title: "Construire from scratch",
        items: [
          "Des semaines sur la configuration de l'auth",
          "Intégration des paiements complexe",
          "Conception du schéma de base de données",
          "Patterns de code incohérents",
        ],
      },
      with: {
        title: "Construire avec Moodday",
        items: [
          "Auth prête en minutes",
          "Stripe pré-configuré",
          "Patterns de base de données éprouvés",
          "Architecture cohérente et scalable",
        ],
      },
    },
    cta: {
      title: "Prêt à livrer plus vite ?",
      subtitle: "Commencez à construire aujourd'hui.",
      button: "Commencer",
    },
    ctaCard: {
      title: "Lancez votre SaaS aujourd'hui",
      description: "Clonez le repo et commencez à construire en minutes.",
      primaryCta: "Commencer",
      secondaryCta: "Voir la doc",
    },
    ctaImage: {
      title: "Livrez votre produit plus vite",
      description:
        "Concentrez-vous sur vos fonctionnalités, pas le boilerplate.",
      cta: "Commencer",
    },
    faq: {
      titleShort: "FAQ",
      title: "Questions fréquentes",
      items: [
        {
          question: "Qu'est-ce que Moodday ?",
          answer:
            "Moodday est un boilerplate Next.js moderne qui inclut authentification, paiements, base de données et emails - tout ce qu'il faut pour lancer un SaaS rapidement.",
        },
        {
          question: "Quelle stack technique utilise Moodday ?",
          answer:
            "Next.js 16, TypeScript, TailwindCSS v4, Prisma ORM, Better Auth, Stripe, React Email et Resend.",
        },
        {
          question: "Le code est-il prêt pour la production ?",
          answer:
            "Oui, Moodday suit les bonnes pratiques avec TypeScript en mode strict, gestion d'erreurs appropriée et patterns d'architecture scalables.",
        },
        {
          question: "Puis-je l'utiliser pour des projets commerciaux ?",
          answer:
            "Absolument ! Moodday est conçu pour construire des applications SaaS commerciales.",
        },
        {
          question: "Comment démarrer ?",
          answer:
            "Clonez le repository, lancez pnpm setup pour configurer votre environnement, et vous êtes prêt à construire.",
        },
        {
          question: "Quelle base de données supporte-t-il ?",
          answer:
            "Moodday utilise PostgreSQL avec Prisma ORM. NeonDB est recommandé pour les déploiements serverless.",
        },
        {
          question: "L'authentification est-elle incluse ?",
          answer:
            "Oui, l'authentification multi-provider avec GitHub, Google, email/mot de passe et magic links est pré-configurée avec Better Auth.",
        },
      ],
    },
    reviews: {
      at: "chez",
      avatarAlt: "Avatar de {name}",
      avatarAltGeneric: "Avatar",
      triple: [
        {
          image: "https://i.pravatar.cc/300?u=a1",
          name: "Sophie",
          review:
            "Threader **a complètement transformé ma façon de gérer mes réseaux sociaux**. La planification et l'IA me font gagner des heures chaque semaine.",
          role: "Responsable marketing digital",
        },
        {
          image: "https://i.pravatar.cc/300?u=a2",
          name: "Alex",
          review:
            "Threader a boosté mon engagement. **L'outil d'analyse m'aide à comprendre ce qui fonctionne**, et à affiner ma stratégie.",
          role: "Influenceur réseaux sociaux",
        },
        {
          image: "https://i.pravatar.cc/300?u=a3",
          name: "Jordan",
          review:
            "La planification et l'IA sont des atouts majeurs. **L'interface est ultra intuitive** pour développer sa présence en ligne.",
          role: "Entrepreneur",
        },
      ],
      single: {
        image: "https://i.pravatar.cc/300?u=5",
        name: "Michel",
        review:
          "Threader **a complètement transformé** ma façon de gérer mes réseaux sociaux. La planification et l'IA **m'ont fait gagner des heures chaque semaine.**",
        role: "Responsable marketing digital",
        compagnyImage:
          "https://1000logos.net/wp-content/uploads/2017/03/McDonalds-Logo-2003.png",
      },
      grid: [
        {
          image: "https://i.pravatar.cc/300?u=b1",
          name: "Eva",
          review:
            "Depuis Threader, mon process de création est plus fluide. Les suggestions IA sont pertinentes et m'aident à mieux connecter avec mon audience.",
          role: "Créatrice de contenu",
        },
        {
          image: "https://i.pravatar.cc/300?u=b2",
          name: "Lucas",
          review:
            "La planification est un vrai gain de temps. Je peux organiser mon calendrier et publier aux meilleurs moments sans stress.",
          role: "Social media manager",
        },
        {
          image: "https://i.pravatar.cc/300?u=b3",
          name: "Mia",
          review:
            "Les analytics de Threader sont précieux. J'ai doublé mon taux d'engagement en quelques mois.",
          role: "Responsable marketing digital",
        },
        {
          image: "https://i.pravatar.cc/300?u=b4",
          name: "Noah",
          review:
            "J'étais sceptique sur l'IA, mais Threader m'a convaincu. Le contenu reste humain et booste les interactions.",
          role: "Blogueur",
        },
        {
          image: "https://i.pravatar.cc/300?u=b5",
          name: "Isabella",
          review:
            "L'interface est très simple. Mon équipe a été opérationnelle rapidement et nos résultats se sont améliorés.",
          role: "Team leader",
        },
        {
          image: "https://i.pravatar.cc/300?u=b6",
          name: "Oliver",
          review:
            "Le repost automatique est devenu indispensable. Je maximise mes meilleurs contenus sans effort.",
          role: "Freelance",
        },
        {
          image: "https://i.pravatar.cc/300?u=b7",
          name: "Sophia",
          review:
            "La communauté Threader offre de vraies opportunités de réseau. C'est plus qu'un outil.",
          role: "Influenceuse",
        },
        {
          image: "https://i.pravatar.cc/300?u=b8",
          name: "Elijah",
          review:
            "La vue calendrier me permet de visualiser ma stratégie mensuelle. Un vrai game changer.",
          role: "Stratège",
        },
        {
          image: "https://i.pravatar.cc/300?u=b9",
          name: "Charlotte",
          review:
            "Les tarifs sont flexibles et adaptés à tous les niveaux, des débutants aux créateurs établis.",
          role: "Entrepreneuse",
        },
        {
          image: "https://i.pravatar.cc/300?u=b10",
          name: "James",
          review:
            "Le support client est top. Réponses rapides et utiles à chaque fois.",
          role: "Client",
        },
      ],
    },
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
  docs: {
    metaTitle: "Documentation | {app}",
    metaDescription: "Tout ce qu'il faut savoir pour utiliser {app}",
    title: "Documentation",
    description: "Tout ce qu'il faut savoir sur {app}",
    readMore: "Lire plus",
    onThisPage: "Sur cette page",
    requestExamples: "Exemples de requête",
    responseExamples: "Exemples de réponse",
    general: "Général",
    copy: {
      copyPage: "Copier la page",
      viewMarkdown: "Voir en Markdown",
      openV0: "Ouvrir dans v0",
      openChatGpt: "Ouvrir dans ChatGPT",
      openClaude: "Ouvrir dans Claude",
      prompt:
        "Je consulte la documentation {app} : {url}.\nAidez-moi à l'utiliser. Soyez prêt à expliquer les concepts, donner des exemples ou aider au debug.",
    },
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
  changelog: {
    metaTitle: "Journal des modifications - {app}",
    metaDescription:
      "Restez informé des dernières fonctionnalités, améliorations et corrections.",
    title: "Journal des modifications",
    description:
      "Restez informé des dernières fonctionnalités, améliorations et corrections.",
    emptyTitle: "Aucune entrée pour le moment",
    emptyDescription: "Revenez bientôt pour les mises à jour.",
    latest: "Dernière",
    newUpdate: "Nouvelle mise à jour",
    backToChangelog: "Retour au journal",
    detail: {
      metaTitle: "{title} - Journal des modifications - {app}",
      metaTitleShort: "{title} - Journal des modifications",
      metaDescription: "Notes de version pour {title}",
    },
  },
  payment: {
    success: {
      title: "Merci pour votre achat !",
      description:
        "Votre paiement a été effectué avec succès. Vous avez maintenant accès aux ressources premium. Nous sommes là pour vous aider si besoin.",
      cta: "Commencer",
    },
    cancel: {
      badge: "Paiement échoué",
      title: "Nous n'avons pas pu traiter votre paiement",
      lineOne: "Un problème est survenu lors du traitement du paiement.",
      lineTwo: "Vérifiez vos informations et réessayez.",
      lineThree:
        "Si le problème persiste, n'hésitez pas à nous contacter pour obtenir de l'aide.",
      lineFour: "Nous sommes là pour vous aider à résoudre cela.",
    },
  },
  about: {
    metaTitle: "À propos de {app}",
    metaDescription:
      "Découvrez Moodday, le boilerplate Next.js moderne conçu pour aider les développeurs à livrer des produits SaaS plus rapidement.",
    hero: {
      kicker: "À propos",
      title: "Livrez plus vite avec une base solide",
      description:
        "Un boilerplate de confiance, construit par des développeurs pour des développeurs, avec des mises à jour continues et un focus sur les bonnes pratiques modernes.",
    },
    commitment: {
      title: "Notre engagement envers vous",
      paragraphOne:
        "Moodday est construit avec une vision long terme et un engagement envers la communauté des développeurs. Choisir un boilerplate, c'est lui faire confiance comme fondation de votre produit.",
      paragraphTwo:
        "C'est pourquoi nous garantissons des mises à jour régulières, des améliorations continues et une documentation claire. Vous aurez toujours accès aux derniers patterns et bonnes pratiques.",
    },
    gallery: {
      altOne: "Créateur enregistrant un témoignage",
      altTwo: "Collaboration d'équipe sur des témoignages",
      altThree: "Vitrine numérique de témoignages",
      altFour: "Succès d'un créateur",
    },
    reliability: {
      title: "Notre promesse de fiabilité",
      items: [
        {
          label: "Mises à jour hebdomadaires",
          value: "100",
          suffix: "%",
        },
        {
          label: "Disponibilité garantie",
          value: "99.9",
          suffix: "%",
        },
        {
          label: "Temps de réponse",
          value: "<24",
          suffix: "h",
        },
        {
          label: "Années d'engagement",
          value: "10",
          suffix: "+",
        },
      ],
    },
  },
  contact: {
    metaTitle: "Contact {app}",
    metaDescription:
      "Contactez l'équipe Moodday. Nous sommes là pour répondre à vos questions sur le boilerplate, les fonctionnalités ou le support technique.",
    title: "Contactez-nous",
    description:
      "Des questions sur Moodday ? Besoin d'aide pour la configuration ou envie de partager un retour ? Nous sommes là pour vous aider.",
    details: {
      location: "Localisation",
      email: "Email",
      responseTime: "Temps de réponse",
      responseLineOne: "Réponse sous 24 heures en général",
      responseLineTwo: "Lundi - Vendredi, 9h - 18h ICT",
    },
    form: {
      firstName: "Prénom",
      lastName: "Nom",
      email: "Email",
      subject: "Sujet",
      message: "Message",
      submit: "Envoyer le message",
      success: "Votre message a été envoyé",
      invalid: "Entrée invalide",
    },
  },
  legal: {
    terms: {
      metaTitle: "{app} - Conditions",
      metaDescription: "Conditions d'utilisation",
      title: "Conditions",
      content: "Démo des conditions",
    },
    privacy: {
      metaTitle: "{app} - Confidentialité",
      metaDescription: "Politique de confidentialité",
      title: "Confidentialité",
      content: "Démo de confidentialité",
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
};

export default fr;
