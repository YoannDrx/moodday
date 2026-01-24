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
  },
  footer: {
    description:
      "Digital clinical journal to track your mental health journey.",
    product: "Product",
    blog: "Blog",
    documentation: "Documentation",
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
  },
  common: {
    error: "An error occurred",
    saving: "Saving...",
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
    list: {
      title: "My medications",
      empty: "No medications yet. Add your first medication to start tracking!",
      addNew: "Add medication",
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
      skipped: "Medication skipped",
      undone: "Intake cancelled",
      undo: "Cancel",
      skip: "Skip today",
    },
    today: {
      title: "Today's medications",
      subtitle: "Mark your medications as taken",
      empty: "No regular medications. Add one to start tracking!",
      allDone: "All done for today!",
      progress: "{taken} of {total} taken",
    },
  },
  mood: {
    entry: {
      title: "How are you feeling?",
      editTitle: "Edit your mood",
      notePlaceholder: "Add a note (optional)...",
      save: "Save my mood",
      saved: "Mood saved!",
      update: "Update",
      updated: "Mood updated!",
      delete: "Delete",
      deleted: "Entry deleted",
      deleteTitle: "Delete this entry?",
      deleteDescription:
        "This action cannot be undone. Your mood entry will be permanently removed.",
      deleteConfirm: "Yes, delete it",
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
    },
    edit: {
      title: "Edit session",
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
      empty: "No sessions yet. Record your first therapy session!",
      addNew: "Add session",
    },
    delete: {
      title: "Delete this session?",
      description: "This action cannot be undone.",
      confirm: "Yes, delete it",
      success: "Session deleted",
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
  },
  onboarding: {
    title: "Welcome to Moodday",
    next: "Continue",
    skip: "Skip for now",
    start: "Get started",
    complete: "Welcome! You're all set.",
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
  settings: {
    title: "Settings",
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
    saved: "Settings saved!",
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
      free: "Perfect for individuals and small projects",
      pro: "Ideal for growing teams with advanced needs",
      ultra: "Enterprise-grade for large teams and complex workflows",
    },
    limits: {
      projects: {
        label: "{value} projects",
        description: "Create and manage projects",
      },
      storage: {
        label: "{value} GB storage",
        description: "Cloud storage for your files",
      },
      members: {
        label: "{value} team members",
        description: "Invite team members to collaborate",
      },
    },
    additionalFeatures: {
      free: [
        {
          label: "Basic security",
          description: "Standard protection for your data",
        },
      ],
      pro: [
        {
          label: "Priority support",
          description: "Get help when you need it most",
        },
        {
          label: "24/7 customer service",
          description: "Round-the-clock assistance",
        },
        {
          label: "Advanced analytics",
          description: "Detailed insights and reporting",
        },
      ],
      ultra: [
        {
          label: "Priority support",
          description: "Get help when you need it most",
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
    form: {
      name: "Name",
      email: "Email",
      emailPlaceholder: "you@example.com",
      password: "Password",
    },
    signIn: {
      metaTitle: "Sign in to {app}",
      metaDescription: "Access your account to manage testimonials.",
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
  landing: {
    hero: {
      titlePrefix: "Ship your SaaS",
      titleHighlight: "in days, not months",
      description:
        "A modern Next.js boilerplate with authentication, payments, emails, and database - everything you need to launch fast.",
      ctaPrimary: "Get started",
      ctaSecondary: "View features",
      imageAlt: "Dashboard screenshot",
    },
    stats: {
      one: "Hours saved",
      two: "Active developers",
      three: "Projects launched",
      four: "Setup time",
    },
    bento: {
      avatarAlt: "Avatar",
      items: {
        ai: {
          title: "Authentication",
          description:
            "Multi-provider auth with GitHub, Google, and magic links.",
        },
        schedule: {
          title: "Payments",
          description:
            "Stripe integration with subscriptions and billing portal.",
        },
        calendar: {
          title: "Database",
          description: "PostgreSQL with Prisma ORM and multi-tenant support.",
        },
        analytics: {
          title: "Email",
          description:
            "Beautiful transactional emails with React Email and Resend.",
        },
        research: {
          title: "Organizations",
          description: "Multi-tenant support with roles and permissions.",
        },
      },
      skeleton: {
        threadPrompt: "Create your first project",
        threadResponse:
          "Your Moodday project is ready! Start building your SaaS in minutes.",
        schedulePending: "Setting up your environment...",
        scheduleSuccess: "Your development server is running on localhost:3000",
        researchQuestion: "What stack does Moodday use?",
        searching: "Loading...",
        researchAnswer:
          "Next.js 16, TypeScript, TailwindCSS, Prisma, Better Auth, and Stripe.",
      },
      stats: {
        followers: "+{count} features",
        views: "+{count} components",
        likes: "{count} downloads",
        replies: "{count} stars",
        last30Days: "Included out of the box",
      },
    },
    features: {
      badge: "Everything included.",
      title: "Build faster with a complete",
      titleEmphasis: "stack",
      description:
        "Everything you need to launch a production-ready SaaS application.",
      items: [
        {
          badge: "Auth",
          title: "Authentication ready",
          description:
            "Sign in with GitHub, Google, or magic links out of the box.",
        },
        {
          badge: "Payments",
          title: "Stripe integration",
          description:
            "Subscriptions, webhooks, and customer portal already configured.",
        },
        {
          badge: "Database",
          title: "PostgreSQL + Prisma",
          description:
            "Type-safe database access with migrations and seeding scripts.",
        },
        {
          badge: "Email",
          title: "Transactional emails",
          description:
            "Beautiful email templates with React Email and Resend integration.",
        },
      ],
    },
    pain: {
      title: "I love building SaaS products...",
      subtitle: "But setting up the basics takes forever",
      without: {
        title: "Building from scratch",
        items: [
          "Weeks spent on authentication setup",
          "Complex payment integration",
          "Database schema design",
          "Inconsistent code patterns",
        ],
      },
      with: {
        title: "Building with Moodday",
        items: [
          "Auth ready in minutes",
          "Stripe pre-configured",
          "Proven database patterns",
          "Consistent, scalable architecture",
        ],
      },
    },
    cta: {
      title: "Ready to ship faster?",
      subtitle: "Start building today.",
      button: "Get started",
    },
    ctaCard: {
      title: "Launch your SaaS today",
      description: "Clone the repo and start building in minutes.",
      primaryCta: "Get started",
      secondaryCta: "View docs",
    },
    ctaImage: {
      title: "Ship your product faster",
      description: "Focus on your features, not the boilerplate.",
      cta: "Get started",
    },
    faq: {
      titleShort: "FAQ",
      title: "Frequently Asked Questions",
      items: [
        {
          question: "What is Moodday?",
          answer:
            "Moodday is a modern Next.js boilerplate that includes authentication, payments, database, and email - everything you need to launch a SaaS quickly.",
        },
        {
          question: "What tech stack does Moodday use?",
          answer:
            "Next.js 16, TypeScript, TailwindCSS v4, Prisma ORM, Better Auth, Stripe, React Email, and Resend.",
        },
        {
          question: "Is the code production-ready?",
          answer:
            "Yes, Moodday follows best practices with TypeScript strict mode, proper error handling, and scalable architecture patterns.",
        },
        {
          question: "Can I use it for commercial projects?",
          answer:
            "Absolutely! Moodday is designed for building commercial SaaS applications.",
        },
        {
          question: "How do I get started?",
          answer:
            "Clone the repository, run pnpm setup to configure your environment, and you're ready to build.",
        },
        {
          question: "What database does it support?",
          answer:
            "Moodday uses PostgreSQL with Prisma ORM. NeonDB is recommended for serverless deployments.",
        },
        {
          question: "Is authentication included?",
          answer:
            "Yes, multi-provider authentication with GitHub, Google, email/password, and magic links is pre-configured with Better Auth.",
        },
      ],
    },
    reviews: {
      at: "at",
      avatarAlt: "Avatar of {name}",
      avatarAltGeneric: "Avatar",
      triple: [
        {
          image: "https://i.pravatar.cc/300?u=a1",
          name: "Sophie",
          review:
            "Threader **has completely transformed the way I manage my social media** content. The ability to schedule posts and use AI for content suggestions has saved me hours each week.",
          role: "Digital Marketer",
        },
        {
          image: "https://i.pravatar.cc/300?u=a2",
          name: "Alex",
          review:
            "Using Threader has significantly boosted my online engagement. **The analytics tool helps me understand what works**, allowing me to refine my strategy and grow my follower base.",
          role: "Social Media Influencer",
        },
        {
          image: "https://i.pravatar.cc/300?u=a3",
          name: "Jordan",
          review:
            "The ease of scheduling and the AI-generated content features are game-changers. **Threader's user-friendly interface** makes it perfect for anyone looking to enhance their online presence.",
          role: "Entrepreneur",
        },
      ],
      single: {
        image: "https://i.pravatar.cc/300?u=5",
        name: "Michel",
        review:
          "Threader **has completely transformed** the way I manage my social media content. The ability to schedule posts and use AI for content suggestions **has saved me hours each week.**",
        role: "Digital Marketer",
        compagnyImage:
          "https://1000logos.net/wp-content/uploads/2017/03/McDonalds-Logo-2003.png",
      },
      grid: [
        {
          image: "https://i.pravatar.cc/300?u=b1",
          name: "Eva",
          review:
            "Since I started using Threader, my content creation process has been streamlined. The AI suggestions are spot on, helping me connect better with my audience.",
          role: "Content Creator",
        },
        {
          image: "https://i.pravatar.cc/300?u=b2",
          name: "Lucas",
          review:
            "Threader's scheduling feature is a lifesaver. It lets me plan my content calendar efficiently and never miss optimal posting times.",
          role: "Social Media Manager",
        },
        {
          image: "https://i.pravatar.cc/300?u=b3",
          name: "Mia",
          review:
            "The analytics provided by Threader are invaluable. They doubled my engagement rate in just a few months.",
          role: "Digital Marketer",
        },
        {
          image: "https://i.pravatar.cc/300?u=b4",
          name: "Noah",
          review:
            "I was skeptical about AI-generated content, but Threader changed my mind. It feels personal and boosts interaction rates.",
          role: "Blogger",
        },
        {
          image: "https://i.pravatar.cc/300?u=b5",
          name: "Isabella",
          review:
            "Threader's interface is incredibly user-friendly. We onboarded our team in no time and improved performance fast.",
          role: "Team Leader",
        },
        {
          image: "https://i.pravatar.cc/300?u=b6",
          name: "Oliver",
          review:
            "Auto-reposting is the feature I didn't know I needed. It gets more mileage out of my best content.",
          role: "Freelancer",
        },
        {
          image: "https://i.pravatar.cc/300?u=b7",
          name: "Sophia",
          review:
            "Joining the Threader community opened networking opportunities with fellow creators. It's more than a tool.",
          role: "Influencer",
        },
        {
          image: "https://i.pravatar.cc/300?u=b8",
          name: "Elijah",
          review:
            "The calendar view helps me visualize my monthly strategy. It's a game changer for planning.",
          role: "Strategist",
        },
        {
          image: "https://i.pravatar.cc/300?u=b9",
          name: "Charlotte",
          review:
            "Threader's pricing is flexible for creators at every stage, from beginners to established influencers.",
          role: "Entrepreneur",
        },
        {
          image: "https://i.pravatar.cc/300?u=b10",
          name: "James",
          review:
            "The customer support team is fantastic. Quick responses and helpful answers every time.",
          role: "Customer",
        },
      ],
    },
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
  docs: {
    metaTitle: "Documentation | {app}",
    metaDescription: "Everything you need to know about using {app}",
    title: "Documentation",
    description: "Everything you need to know about using {app}",
    readMore: "Read more",
    onThisPage: "On this page",
    requestExamples: "Request examples",
    responseExamples: "Response examples",
    general: "General",
    copy: {
      copyPage: "Copy page",
      viewMarkdown: "View as Markdown",
      openV0: "Open in v0",
      openChatGpt: "Open in ChatGPT",
      openClaude: "Open in Claude",
      prompt:
        "I'm looking at this {app} documentation: {url}.\nHelp me understand how to use it. Be ready to explain concepts, give examples, or help debug based on it.",
    },
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
      "Learn about Moodday, the modern Next.js boilerplate designed to help developers ship SaaS products faster.",
    hero: {
      kicker: "About us",
      title: "Ship faster with a proven foundation",
      description:
        "A boilerplate you can trust, built by developers for developers, with continuous updates and a focus on modern best practices.",
    },
    commitment: {
      title: "Our commitment to you",
      paragraphOne:
        "Moodday is built with a long-term vision and commitment to the developer community. We understand that choosing a boilerplate means trusting it as the foundation of your product.",
      paragraphTwo:
        "That's why we guarantee regular updates, continuous improvements, and clear documentation. You'll always have access to the latest patterns and best practices. We're here to help you ship faster.",
    },
    gallery: {
      altOne: "Content creator recording testimonial",
      altTwo: "Team collaboration on testimonials",
      altThree: "Digital testimonial showcase",
      altFour: "Creator success story",
    },
    reliability: {
      title: "Our reliability promise",
      items: [
        {
          label: "Weekly updates",
          value: "100",
          suffix: "%",
        },
        {
          label: "Uptime guarantee",
          value: "99.9",
          suffix: "%",
        },
        {
          label: "Response time",
          value: "<24",
          suffix: "h",
        },
        {
          label: "Years committed",
          value: "10",
          suffix: "+",
        },
      ],
    },
  },
  contact: {
    metaTitle: "Contact {app}",
    metaDescription:
      "Get in touch with the Moodday team. We're here to help with any questions about the boilerplate, features, or technical support.",
    title: "Get in touch",
    description:
      "Have questions about Moodday? Need help with setup or want to share feedback? We're here to help and always excited to hear from the community.",
    details: {
      location: "Location",
      email: "Email",
      responseTime: "Response time",
      responseLineOne: "Usually respond within 24 hours",
      responseLineTwo: "Monday - Friday, 9 AM - 6 PM ICT",
    },
    form: {
      firstName: "First name",
      lastName: "Last name",
      email: "Email",
      subject: "Subject",
      message: "Message",
      submit: "Send message",
      success: "Your message has been sent",
      invalid: "Invalid input",
    },
  },
  legal: {
    terms: {
      metaTitle: "{app} - Terms",
      metaDescription: "Terms of service",
      title: "Terms",
      content: "Terms demo",
    },
    privacy: {
      metaTitle: "{app} - Privacy",
      metaDescription: "Privacy policy",
      title: "Privacy",
      content: "Privacy demo",
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
      badge: "Compassionate clinical journal",
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
      error: "An error occurred. Please try again.",
      privacy: "We respect your privacy. Easy unsubscribe.",
    },
    mobileApp: {
      badge: "Coming soon",
      title: "Mobile app",
      subtitle: "Take Moodday everywhere with you",
      comingSoon: "Soon",
      features: {
        offline: "Offline mode",
        notifications: "Reminders",
        sync: "Auto sync",
      },
    },
  },
};

export default en;
