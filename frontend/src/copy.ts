// Plain business English user-facing copy
// All user-facing strings are defined here in plain language without technical jargon.

export const COPY = {
  brand: {
    name: 'Tessera',
    tagline: 'Privacy-first fraud workspace',
    namesHidden: 'Customer names hidden',
    namesVisible: (n: number) =>
      `${n} ${n === 1 ? 'customer name' : 'customer names'} visible to you`,
  },

  nav: {
    cases: 'Cases to review',
    nameRequests: 'Name requests',
    activityLog: 'Activity log',
    signOut: 'Sign out',
  },

  auth: {
    title: 'Sign in to your account',
    subtitle: 'Investigate fraud without exposing customer names.',
    heroHeadline: 'Investigate fraud without exposing customer names.',
    bullets: [
      'Customer names are hidden from the AI at all times.',
      'A second person must approve every customer name release.',
      'Every action is recorded in a tamper-checked activity log.',
    ],
    emailLabel: 'Work email address',
    emailPlaceholder: 'analyst@bank.com',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter your password',
    signInButton: 'Sign in',
    signingIn: 'Signing in...',
    sessionExpired: 'You were signed out. Please sign in again.',
    accessDenied: "Your role doesn't have access to this page.",
    networkError:
      "We couldn't reach the server. Check that it is running, then try again.",
    demoAccountsTitle: 'Quick sign in with demo accounts',
    roles: {
      analyst: {
        title: 'Analyst',
        desc: 'Review cases and request names',
      },
      investigator: {
        title: 'Senior Investigator',
        desc: 'Approve name requests',
      },
      auditor: {
        title: 'Auditor',
        desc: 'Inspect activity log and reports',
      },
      admin: {
        title: 'Admin',
        desc: 'Manage roles and system settings',
      },
      service: {
        title: 'Service Account',
        desc: 'Automated data feed',
      },
    },
  },

  caseQueue: {
    title: 'Cases to review',
    subLine: (n: number) => `${n} cases need your review, highest risk first.`,
    searchPlaceholder: 'Search by case ID, customer ID, or note...',
    kpis: {
      waiting: 'Waiting for review',
      highRisk: 'High risk',
      pendingReveals: 'Name requests waiting',
      aiNamesSeen: 'Real names the AI has seen',
      aiNamesSub: 'The AI only works with anonymous IDs.',
    },
    filters: {
      allStatuses: 'All statuses',
      open: 'Open',
      underReview: 'Under review',
      resolved: 'Resolved',
      overridden: 'Risk changed',
      allRisks: 'All risk levels',
      critical: 'Critical',
      high: 'High',
      medium: 'Medium',
      low: 'Low',
    },
    table: {
      caseId: 'Case ID',
      customer: 'Customer',
      anonymousIdTooltip: 'Anonymous ID',
      amount: 'Amount',
      checks: 'Checks',
      risk: 'Risk rating',
      status: 'Status',
      raised: 'Raised',
      actions: 'Action',
      review: 'Review',
    },
    emptyState:
      'No cases match your filter. Try clearing your search or filter options.',
    previewTitle: 'Quick case preview',
    previewSelectHint: 'Select a case in the table to preview details here.',
    viewFullCase: 'Open full case',
  },

  caseDetail: {
    backToQueue: 'Back to cases',
    raisedOn: 'Raised',
    caseTitle: (id: string) => `Case #${id}`,
    transactionOverview: 'Transaction overview',
    customer: 'Customer',
    recipient: 'Recipient',
    amount: 'Amount',
    raised: 'Raised date',
    whyFlagged: 'Why this was flagged',
    riskScore: 'Risk score',
    whatRaisedRisk: 'What raised the risk',
    scoreCaption: 'Estimated from the checks that were triggered.',
    whatWeFound: 'What we found',
    howSure: 'How sure the AI is',
    evidenceList: 'Evidence from fraud checks',
    riskChangedBy: (user: string) => `Risk rating changed by ${user}`,
    changeRiskButton: 'Change the risk rating',
    identityBox: {
      title: 'Customer identity',
      lockedTitle: 'Customer name hidden until approved',
      unlockedTitle: 'Sensitive customer identity',
      lockedHelp:
        'A second person must approve before this name is shown. Your request and reason are recorded.',
      unlockedHelp:
        'This name was released after approval. It will disappear when your session ends.',
      requestButton: 'Request customer name',
      requestPending: 'Name request waiting for senior approval',
      realName: 'Customer legal name',
      accountNumber: 'Legal account number',
      releasedBy: 'Released by',
    },
    requestModal: {
      title: 'Request customer name',
      help: 'A second person must approve this before the name is shown. Your request and reason are recorded.',
      categoryLabel: 'Reason category',
      categories: [
        'Regulatory or law enforcement report',
        'Direct customer verification required',
        'Senior manager fraud escalation',
        'Court order or legal inquiry',
      ],
      detailLabel: 'Detailed explanation for this request',
      detailPlaceholder:
        'Explain why you need to view the customer name for this investigation...',
      cancel: 'Cancel',
      submit: 'Submit request',
      submitting: 'Submitting request...',
    },
    overrideModal: {
      title: 'Change the risk rating',
      help: 'Update the AI risk rating if your investigation found new facts.',
      newRiskLabel: 'New risk rating',
      reasonLabel: 'Why are you changing this rating?',
      reasonPlaceholder:
        'Explain what facts or evidence justify changing the rating...',
      cancel: 'Cancel',
      submit: 'Save new rating',
      submitting: 'Saving rating...',
    },
  },

  nameRequests: {
    title: 'Name requests',
    subLine:
      'Review and approve requests to see customer names. Two people must sign off.',
    help: 'A second person must approve each request before customer names can be seen.',
    tabs: {
      pending: 'Waiting for approval',
      approved: 'Approved',
      denied: 'Declined',
      all: 'All requests',
    },
    table: {
      id: 'Request ID',
      caseId: 'Case',
      requestedBy: 'Requested by',
      reason: 'Reason given',
      status: 'Status',
      handledBy: 'Approved by',
      date: 'Requested date',
      actions: 'Decision',
    },
    actions: {
      approve: 'Approve',
      decline: 'Decline',
      ownRequestTooltip: "You can't approve your own request.",
      viewCase: 'View case',
    },
    approveModal: {
      title: 'Approve customer name request',
      help: 'Make sure the reason is valid before showing the customer name. This action is permanently recorded.',
      casePrompt: (caseId: string) =>
        `You are approving the release of customer names for case ${caseId}.`,
      confirm: 'Confirm and release name',
      approving: 'Approving...',
      cancel: 'Cancel',
    },
    declineModal: {
      title: 'Decline customer name request',
      help: 'Decline this request if the justification is insufficient.',
      casePrompt: (caseId: string) =>
        `Are you sure you want to decline the name request for case ${caseId}?`,
      confirm: 'Confirm decline',
      declining: 'Declining...',
      cancel: 'Cancel',
    },
    successModal: {
      title: 'Customer name released',
      notice:
        'This is shown once. Close this window and it is gone from your screen.',
      customerName: 'Customer legal name',
      recipientName: 'Recipient legal name',
      fingerprint: 'Security fingerprint',
      previousFingerprint: 'Previous fingerprint',
      logId: 'Activity log entry ID',
      close: 'Close window',
    },
    emptyState:
      'No name requests found. Check back when an investigator requests customer details.',
  },

  activityLog: {
    title: 'Activity log',
    intro:
      'A record of who did what. Entries are linked so changes can be detected.',
    help: 'Each entry is cryptographically linked to the previous one to detect any tampering.',
    checkLogButton: 'Check the log',
    checkingLog: 'Checking log...',
    checkSuccess: 'The log is intact. No entries have been changed.',
    checkFailure: (id: string | null) =>
      `Warning: the log may have been changed. The first problem is at entry ${id || 'unknown'}.`,
    checkTotalLogs: (total: number) => `Total entries checked: ${total}`,
    downloadPdf: 'Download PDF report',
    downloadCsv: 'Download spreadsheet (CSV)',
    downloading: 'Downloading...',
    filters: {
      allActions: 'All actions',
      allActors: 'All team members',
    },
    table: {
      time: 'Date & time',
      actor: 'Team member',
      action: 'Action taken',
      target: 'Target case',
      fingerprint: 'Security fingerprint',
      previousFingerprint: 'Previous fingerprint',
      copy: 'Copy',
      copied: 'Copied',
    },
    emptyState:
      'No activity log entries match your filter. Try choosing all actions.',
  },

  agentLabels: {
    KYC_AGENT: 'Watchlist check',
    PATTERN_AGENT: 'Past fraud match',
    BEHAVIORAL_AGENT: 'Unusual behaviour',
    GRAPH_AGENT: 'Linked accounts',
  } as Record<string, string>,

  actionLabels: {
    SYSTEM_INIT: 'System started',
    USER_REGISTER: 'New user added',
    LOGIN: 'User signed in',
    REVEAL_REQUEST_SUBMITTED: 'Customer name requested',
    REVEAL_APPROVED: 'Customer name released',
    REVEAL_DENIED: 'Customer name request declined',
    VERDICT_OVERRIDE: 'Risk rating changed',
  } as Record<string, string>,

  statusLabels: {
    OPEN: 'Open',
    UNDER_REVIEW: 'Under review',
    RESOLVED: 'Resolved',
    OVERRIDDEN: 'Risk changed',
    PENDING: 'Pending',
    APPROVED: 'Approved',
    DENIED: 'Declined',
  } as Record<string, string>,

  riskLabels: {
    CRITICAL: 'Critical',
    HIGH: 'High',
    MEDIUM: 'Medium',
    LOW: 'Low',
  } as Record<string, string>,

  common: {
    loading: 'Loading data...',
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    copy: 'Copy',
    copied: 'Copied',
    tryAgain: 'Try again',
    notFoundTitle: 'Page not found',
    notFoundText:
      "We couldn't find the page you were looking for. Go back to cases to review.",
    backToCases: 'Go to cases to review',
  },
};
