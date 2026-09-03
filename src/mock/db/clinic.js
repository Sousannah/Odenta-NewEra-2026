export const clinic = {
  id: "CLN-01",
  name: "Avicena Clinic",
  address: "845 Euclid Avenue, CA",
  timezone: "GMT +07:00",
  branches: [
    { id: "CLN-01", name: "Avicena Clinic", address: "845 Euclid Avenue, CA" },
    { id: "CLN-02", name: "Avicena Downtown", address: "12 Harbour Road, CA" },
  ],
};

export const currentUser = {
  id: "USR-01",
  name: "Darrell Steward",
  firstName: "John",
  role: "Super admin",
  email: "darrell.steward@odenta.clinic",
  onboarding: { completed: 1, total: 4 },
};

export const supportThreads = [
  {
    id: "SUP-01",
    subject: "Cannot print receipt from Bill #10102",
    channel: "Email",
    requester: "Mariem Johnson",
    status: "OPEN",
    priority: "High",
    updatedAt: "2022-05-25T09:12:00",
    unread: 2,
    messages: [
      {
        id: "M1",
        from: "Mariem Johnson",
        me: false,
        at: "2022-05-25T09:02:00",
        body: "The print receipt button opens a blank window on the front desk PC.",
      },
      {
        id: "M2",
        from: "Odenta Support",
        me: true,
        at: "2022-05-25T09:12:00",
        body: "Thanks for flagging. Could you confirm the browser and whether pop-ups are blocked?",
      },
    ],
  },
  {
    id: "SUP-02",
    subject: "Request: bulk export for patient list",
    channel: "In-app",
    requester: "Darrell Steward",
    status: "PENDING",
    priority: "Medium",
    updatedAt: "2022-05-24T15:40:00",
    unread: 0,
    messages: [
      {
        id: "M1",
        from: "Darrell Steward",
        me: false,
        at: "2022-05-24T15:40:00",
        body: "We need a CSV export of all active patients for the insurance audit.",
      },
    ],
  },
  {
    id: "SUP-03",
    subject: "Stock alert threshold not triggering",
    channel: "Email",
    requester: "Bennett Cole",
    status: "RESOLVED",
    priority: "Low",
    updatedAt: "2022-05-21T11:05:00",
    unread: 0,
    messages: [
      {
        id: "M1",
        from: "Bennett Cole",
        me: false,
        at: "2022-05-20T10:00:00",
        body: "Prophy Paste hit zero without an alert being raised.",
      },
      {
        id: "M2",
        from: "Odenta Support",
        me: true,
        at: "2022-05-21T11:05:00",
        body: "Fixed — the reorder threshold was set to 0. It now reads 25.",
      },
    ],
  },
];

export const helpArticles = [
  { id: "HLP-01", title: "Adding a patient to the waitlist", category: "Reservations", minutes: 3 },
  { id: "HLP-02", title: "Completing a 4-step medical checkup", category: "Clinical", minutes: 6 },
  { id: "HLP-03", title: "Splitting a bill across accounts", category: "Finance", minutes: 4 },
  { id: "HLP-04", title: "Setting stock reorder thresholds", category: "Inventory", minutes: 2 },
];
