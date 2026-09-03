import { addDays, format, subDays } from "date-fns";

const iso = (date) => format(date, "yyyy-MM-dd");
const stamp = (date, time) => `${iso(date)}T${time}`;
const today = new Date();

/**
 * Accounts are "pockets" the clinic splits money into. Each carries its own
 * icon + colour so the cards stay recognisable, and can be deactivated
 * without losing history.
 */
export const accounts = [
  {
    id: "ACC-01",
    name: "Free Cash",
    description: "This is money for this need",
    icon: "cash",
    color: "pink",
    isDefault: true,
    active: true,
    balance: 4012409,
    accountNo: null,
    change: 4.51,
  },
  {
    id: "ACC-02",
    name: "Drug Purchase",
    description: "Reserved for medicine restocking",
    icon: "pill",
    color: "violet",
    isDefault: false,
    active: true,
    balance: 4120130,
    accountNo: "124 1245 3567 0987",
    change: -2.1,
  },
  {
    id: "ACC-03",
    name: "Treatment Fund",
    description: "Income collected from patient treatments",
    icon: "tooth",
    color: "rose",
    isDefault: false,
    active: true,
    balance: 3341786,
    accountNo: "312 3123 3123 3314",
    change: 8.24,
  },
  {
    id: "ACC-04",
    name: "Stock Fund",
    description: "This is money for this need",
    icon: "jar",
    color: "amber",
    isDefault: false,
    active: true,
    balance: 2139209,
    accountNo: null,
    change: 1.02,
  },
  {
    id: "ACC-05",
    name: "Monthly Rent",
    description: "Set aside for premises rent",
    icon: "building",
    color: "slate",
    isDefault: false,
    active: false,
    balance: 6123434,
    accountNo: "009 2345 2224 3446",
    change: 0,
  },
  {
    id: "ACC-06",
    name: "Equipment Reserve",
    description: "Capital replacement fund",
    icon: "briefcase",
    color: "teal",
    isDefault: false,
    active: false,
    balance: 3246245,
    accountNo: "004 3345 2234 5678",
    change: 0,
  },
  {
    id: "ACC-07",
    name: "Staff Bonus Pool",
    description: "Quarterly performance pool",
    icon: "user",
    color: "green",
    isDefault: false,
    active: false,
    balance: 5234234,
    accountNo: "004 3334 5556 2344",
    change: 0,
  },
];

export const accountTransactions = [
  { id: "TRX-01", accountId: "ACC-01", date: stamp(today, "10:23:00"), label: "Payment of booking fee", reference: "BILL00124", direction: "in", amount: 140, method: "Credit card", by: "Mariem Johnson", billId: "BILL00124" },
  { id: "TRX-02", accountId: "ACC-03", date: stamp(today, "11:23:00"), label: "Payment of treatment", reference: "BILL00124", direction: "in", amount: 14000, method: "Cash", by: "Mariana Jonson", billId: "BILL00124" },
  { id: "TRX-03", accountId: "ACC-03", date: stamp(today, "11:23:00"), label: "Payment of Booking Fee", reference: "BILL00120", direction: "in", amount: 2000, method: "Cash", by: "Siti Nuw Ja", billId: "BILL00120" },
  { id: "TRX-04", accountId: "ACC-02", date: stamp(subDays(today, 1), "09:00:00"), label: "Restock Asam Menefamat", reference: "PO-2214", direction: "out", amount: 320, method: "Bank transfer", by: "Priya Raman", billId: null },
  { id: "TRX-05", accountId: "ACC-04", date: stamp(subDays(today, 2), "16:45:00"), label: "Composite Porseline restock", reference: "PO-2213", direction: "out", amount: 780, method: "Bank transfer", by: "Priya Raman", billId: null },
  { id: "TRX-06", accountId: "ACC-01", date: stamp(subDays(today, 3), "14:12:00"), label: "Transfer to Treatment Fund", reference: "TRF-0091", direction: "out", amount: 1500, method: "Internal transfer", by: "Darrell Steward", billId: null },
  { id: "TRX-07", accountId: "ACC-03", date: stamp(subDays(today, 3), "14:12:00"), label: "Transfer from Free Cash", reference: "TRF-0091", direction: "in", amount: 1500, method: "Internal transfer", by: "Darrell Steward", billId: null },
  { id: "TRX-08", accountId: "ACC-01", date: stamp(subDays(today, 4), "12:00:00"), label: "Payment of treatment", reference: "BILL00111", direction: "in", amount: 3000, method: "QRIS", by: "Mariem Johnson", billId: "BILL00111" },
];

/* ------------------------------------------------------------------- bills */

const bill = (overrides) => ({
  isNew: false,
  ...overrides,
});

export const bills = [
  bill({
    id: "BILL00124",
    appointmentId: "RSVA1006",
    patientId: "PT-1004",
    patient: "Angkasa Pura",
    reservationDate: iso(today),
    isNew: true,
    payment: "PARTIALLY PAID",
    total: 2311,
    items: [
      { id: "BI-1", ref: "1244", label: "Booking Fee", amount: 100, status: "UNPAID" },
      { id: "BI-2", ref: "1243", label: "2 Treatment(s)", amount: 435, status: "SET PAYMENT" },
    ],
    breakdown: {
      treatments: [
        { name: "Tooth Filling", code: "D2392", detail: "2nd molar (18), 3rd molar (17)", amount: 220 },
        { name: "Tooth Cleaning", code: "D1110", detail: "Maxilla, Mandible", amount: 80 },
      ],
      components: [
        { name: "Anesthetic (1)", detail: "Include in service", amount: 0 },
        { name: "Composite Porseline (5)", detail: "", amount: 120 },
      ],
      medicine: [{ name: "Asam Menefamat (1)", detail: "Paid medicine", amount: 15 }],
    },
  }),
  bill({
    id: "BILL00125",
    appointmentId: "RSVA1007",
    patientId: "PT-1007",
    patient: "Albert Flores",
    reservationDate: iso(today),
    payment: "PARTIALLY PAID",
    total: 535,
    items: [
      { id: "BI-3", ref: "1242", label: "Booking Fee", amount: 100, status: "UNPAID" },
      { id: "BI-4", ref: "1241", label: "2 Treatment(s)", amount: 435, status: "SET PAYMENT" },
    ],
    breakdown: {
      treatments: [
        { name: "Root Canal Treatment", code: "D3330", detail: "Tooth 36 — obturation", amount: 300 },
        { name: "Tooth Cleaning", code: "D1110", detail: "Mandible", amount: 80 },
      ],
      components: [{ name: "Gutta percha (1)", detail: "", amount: 40 }],
      medicine: [{ name: "Asam Menefamat (1)", detail: "Paid medicine", amount: 15 }],
    },
  }),
  bill({
    id: "BILL00121",
    appointmentId: "RSVA1002",
    patientId: "PT-1003",
    patient: "Sekar Nandita",
    reservationDate: iso(today),
    payment: "UNPAID",
    total: 140,
    items: [{ id: "BI-5", ref: "1240", label: "1 Treatment(s)", amount: 140, status: "SET PAYMENT" }],
    breakdown: {
      treatments: [{ name: "Tooth Scaling", code: "D1110", detail: "Maxilla, Mandible", amount: 140 }],
      components: [],
      medicine: [],
    },
  }),
  bill({
    id: "BILL00120",
    appointmentId: "RSVA1001",
    patientId: "PT-1002",
    patient: "Rafli Jainudin",
    reservationDate: iso(today),
    payment: "FULLY PAID",
    total: 120,
    items: [{ id: "BI-6", ref: "1239", label: "1 Treatment(s)", amount: 120, status: "PAID" }],
    breakdown: {
      treatments: [{ name: "General Checkup", code: "D0120", detail: "Full mouth", amount: 120 }],
      components: [],
      medicine: [],
    },
  }),
  bill({
    id: "BILL00122",
    appointmentId: "RSVA1003",
    patientId: "PT-1005",
    patient: "Lembayung Senja",
    reservationDate: iso(today),
    payment: "UNPAID",
    total: 300,
    items: [{ id: "BI-7", ref: "1238", label: "1 Treatment(s)", amount: 300, status: "SET PAYMENT" }],
    breakdown: {
      treatments: [{ name: "Tooth Extraction", code: "D7140", detail: "Tooth 48", amount: 300 }],
      components: [{ name: "Gauze pack (2)", detail: "", amount: 4 }],
      medicine: [{ name: "Amoxicillin (15)", detail: "Paid medicine", amount: 12 }],
    },
  }),
  bill({
    id: "BILL00128",
    appointmentId: "RSVA1011",
    patientId: "PT-1010",
    patient: "Brooklyn Simmons",
    reservationDate: iso(today),
    payment: "PARTIALLY PAID",
    total: 667,
    items: [
      { id: "BI-8", ref: "1237", label: "Booking Fee", amount: 167, status: "PAID" },
      { id: "BI-9", ref: "1236", label: "1 Treatment(s)", amount: 500, status: "SET PAYMENT" },
    ],
    breakdown: {
      treatments: [{ name: "Veneer", code: "D2740", detail: "11, 12, 21, 22", amount: 500 }],
      components: [{ name: "Bonding agent (1)", detail: "", amount: 14 }],
      medicine: [],
    },
  }),
  bill({
    id: "BILL00129",
    appointmentId: "RSVA1012",
    patientId: "PT-1011",
    patient: "Bessie Cooper",
    reservationDate: iso(today),
    payment: "UNPAID",
    total: 343,
    items: [{ id: "BI-10", ref: "1235", label: "1 Treatment(s)", amount: 343, status: "SET PAYMENT" }],
    breakdown: {
      treatments: [{ name: "Complete Denture", code: "D5110", detail: "Jaw relation visit", amount: 343 }],
      components: [],
      medicine: [],
    },
  }),
  bill({
    id: "BILL00111",
    appointmentId: "RSVA0902",
    patientId: "PT-1013",
    patient: "Willie Jennie",
    reservationDate: iso(subDays(today, 1)),
    payment: "FULLY PAID",
    total: 3000,
    items: [{ id: "BI-11", ref: "1234", label: "1 Treatment(s)", amount: 3000, status: "PAID" }],
    breakdown: {
      treatments: [{ name: "Tooth Braces (Metal)", code: "D8080", detail: "Maxilla, Mandible", amount: 3000 }],
      components: [],
      medicine: [],
    },
  }),
  bill({
    id: "BILL00110",
    appointmentId: "RSVA0901",
    patientId: "PT-1002",
    patient: "Rafli Jainudin",
    reservationDate: iso(subDays(today, 1)),
    payment: "FULLY PAID",
    total: 120,
    items: [{ id: "BI-12", ref: "1233", label: "1 Treatment(s)", amount: 120, status: "PAID" }],
    breakdown: {
      treatments: [{ name: "General Checkup", code: "D0120", detail: "Full mouth", amount: 120 }],
      components: [],
      medicine: [],
    },
  }),
];

export const billComments = [
  {
    id: "CMT-01",
    billId: "BILL00124",
    type: "comment",
    author: "Mariem Johnson",
    at: stamp(today, "11:23:00"),
    body: "Booking fee were made using a mastercard and had problems due to the network.",
  },
  {
    id: "CMT-02",
    billId: "BILL00124",
    type: "event",
    author: "Mariana Jonson",
    at: stamp(today, "11:23:00"),
    body: "Payment of treatment $140.00 received",
  },
  {
    id: "CMT-03",
    billId: "BILL00124",
    type: "event",
    author: "Mariem Johnson",
    at: stamp(today, "10:23:00"),
    body: "Payment of booking fee $140.00 received",
    note: "She paid with her husband",
  },
];

export const paymentsReceived = [
  { id: "PAY-3341", billId: "BILL00120", patient: "Rafli Jainudin", date: stamp(today, "11:04:00"), method: "Cash", account: "Free Cash", amount: 120, receivedBy: "Mariem Johnson" },
  { id: "PAY-3340", billId: "BILL00124", patient: "Angkasa Pura", date: stamp(today, "10:23:00"), method: "Credit card", account: "Treatment Fund", amount: 140, receivedBy: "Mariem Johnson" },
  { id: "PAY-3339", billId: "BILL00128", patient: "Brooklyn Simmons", date: stamp(today, "09:31:00"), method: "QRIS", account: "Free Cash", amount: 167, receivedBy: "Angela Reyes" },
  { id: "PAY-3338", billId: "BILL00111", patient: "Willie Jennie", date: stamp(subDays(today, 1), "16:20:00"), method: "Bank transfer", account: "Treatment Fund", amount: 3000, receivedBy: "Mariem Johnson" },
  { id: "PAY-3337", billId: "BILL00110", patient: "Rafli Jainudin", date: stamp(subDays(today, 1), "10:12:00"), method: "Cash", account: "Free Cash", amount: 120, receivedBy: "Mariem Johnson" },
];

export const paymentMethods = [
  { id: "PM-01", name: "Cash", type: "Cash", icon: "cash", enabled: true, fee: 0, account: "Free Cash", detail: "Counter payment handled by front office." },
  { id: "PM-02", name: "Credit card", type: "Card", icon: "card", enabled: true, fee: 2.5, account: "Treatment Fund", detail: "Visa, Mastercard and JCB via clinic EDC." },
  { id: "PM-03", name: "QRIS", type: "Wallet", icon: "qr", enabled: true, fee: 0.7, account: "Free Cash", detail: "Scan-to-pay through any registered wallet." },
  { id: "PM-04", name: "Bank transfer", type: "Transfer", icon: "bank", enabled: true, fee: 0, account: "Treatment Fund", detail: "Manual verification within 1 business day." },
  { id: "PM-05", name: "Insurance claim", type: "Insurance", icon: "shield", enabled: false, fee: 0, account: "Treatment Fund", detail: "Partner insurers only. Requires pre-approval." },
];

export const purchases = [
  { id: "PO-2214", vendor: "MedSupply Co.", category: "Medicine", orderDate: iso(subDays(today, 1)), dueDate: iso(addDays(today, 6)), items: 8, total: 320, status: "RECEIVED", account: "Drug Purchase" },
  { id: "PO-2213", vendor: "DentaLab Indonesia", category: "Component", orderDate: iso(subDays(today, 2)), dueDate: iso(addDays(today, 5)), items: 24, total: 780, status: "RECEIVED", account: "Stock Fund" },
  { id: "PO-2212", vendor: "Cahaya Dental", category: "Peripheral", orderDate: iso(subDays(today, 4)), dueDate: iso(addDays(today, 10)), items: 2, total: 4300, status: "IN TRANSIT", account: "Stock Fund" },
  { id: "PO-2211", vendor: "MedSupply Co.", category: "Medicine", orderDate: iso(subDays(today, 8)), dueDate: iso(subDays(today, 1)), items: 15, total: 610, status: "RECEIVED", account: "Drug Purchase" },
  { id: "PO-2210", vendor: "Sterilo Instruments", category: "Component", orderDate: iso(subDays(today, 12)), dueDate: iso(subDays(today, 5)), items: 40, total: 1240, status: "DRAFT", account: "Stock Fund" },
  { id: "PO-2209", vendor: "Cahaya Dental", category: "Peripheral", orderDate: iso(subDays(today, 20)), dueDate: iso(subDays(today, 6)), items: 1, total: 9800, status: "CANCELLED", account: "Stock Fund" },
];

export const financeSummary = {
  revenue: { total: 24310, change: 12.4 },
  profit: { total: 9182, change: 8.1 },
  outstanding: { total: 4996, change: -3.2 },
  collected: { total: 3547, change: 5.6 },
  range: `1 ${format(today, "MMM yyyy")} - ${format(today, "d MMM yyyy")}`,
};
