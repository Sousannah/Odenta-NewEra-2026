import { addDays, format, subDays } from "date-fns";

const iso = (date) => format(date, "yyyy-MM-dd");
const stamp = (date, time) => `${iso(date)}T${time}`;
const today = new Date();

/* ---------------------------------------------------------------- stocks */

export const stocks = [
  { id: "STK-01", name: "Ambesol", category: "Pain and Anxiety", sku: "ZKS8124", vendor: "Barone LLC.", quantity: 0, reorderAt: 20, unit: "tube", status: "OUT OF STOCK", assetValue: 0, unitCost: 6, updatedAt: iso(subDays(today, 2)), expiry: iso(addDays(today, 300)) },
  { id: "STK-02", name: "Anesthesia", category: "Pain and Anxiety", sku: "ZKS8123", vendor: "Dentalku", quantity: 124, reorderAt: 40, unit: "ampoule", status: "IN STOCK", assetValue: 2000, unitCost: 16, updatedAt: iso(today), expiry: iso(addDays(today, 420)) },
  { id: "STK-03", name: "Doxycycline", category: "Periodontal Disease", sku: "ZKS8122", vendor: "Dentalku", quantity: 62, reorderAt: 20, unit: "strip", status: "IN STOCK", assetValue: 1500, unitCost: 24, updatedAt: iso(subDays(today, 1)), expiry: iso(addDays(today, 200)) },
  { id: "STK-04", name: "Lidex", category: "Anti-inflammatory", sku: "ZKS8121", vendor: "Barone LLC.", quantity: 0, reorderAt: 15, unit: "tube", status: "OUT OF STOCK", assetValue: 0, unitCost: 11, updatedAt: iso(subDays(today, 5)), expiry: iso(addDays(today, 150)) },
  { id: "STK-05", name: "Orabase", category: "Anti-inflammatory", sku: "ZKS8120", vendor: "Barone LLC.", quantity: 10, reorderAt: 25, unit: "tube", status: "LOW STOCK", assetValue: 1800, unitCost: 18, updatedAt: iso(subDays(today, 1)), expiry: iso(addDays(today, 90)) },
  { id: "STK-06", name: "Orajel", category: "Pain and Anxiety", sku: "ZKS8119", vendor: "K24", quantity: 40, reorderAt: 15, unit: "tube", status: "IN STOCK", assetValue: 4200, unitCost: 9, updatedAt: iso(today), expiry: iso(addDays(today, 380)) },
  { id: "STK-07", name: "PerioChip", category: "Plaque and Gingivitis", sku: "ZKS8118", vendor: "K24", quantity: 124, reorderAt: 30, unit: "chip", status: "IN STOCK", assetValue: 5200, unitCost: 42, updatedAt: iso(today), expiry: iso(addDays(today, 260)) },
  { id: "STK-08", name: "Peridex", category: "Plaque and Gingivitis", sku: "ZKS8117", vendor: "K24", quantity: 10, reorderAt: 20, unit: "bottle", status: "LOW STOCK", assetValue: 800, unitCost: 14, updatedAt: iso(subDays(today, 3)), expiry: iso(addDays(today, 45)) },
  { id: "STK-09", name: "Temovate", category: "Anti-inflammatory", sku: "ZKS8116", vendor: "Dentalku", quantity: 124, reorderAt: 25, unit: "tube", status: "IN STOCK", assetValue: 300, unitCost: 7, updatedAt: iso(subDays(today, 1)), expiry: iso(addDays(today, 500)) },
  { id: "STK-10", name: "Composite Porseline", category: "Restorative", sku: "ZKS8115", vendor: "DentaLab Indonesia", quantity: 3123, reorderAt: 400, unit: "pcs", status: "IN STOCK", assetValue: 18420, unitCost: 24, updatedAt: iso(today), expiry: iso(addDays(today, 700)) },
  { id: "STK-11", name: "Dental Brush", category: "Consumable", sku: "ZKS8114", vendor: "MedSupply Co.", quantity: 3, reorderAt: 20, unit: "pcs", status: "LOW STOCK", assetValue: 42, unitCost: 2, updatedAt: iso(subDays(today, 2)), expiry: null },
  { id: "STK-12", name: "Charmflex Regular", category: "Impression", sku: "ZKS8113", vendor: "DentaLab Indonesia", quantity: 2, reorderAt: 15, unit: "box", status: "LOW STOCK", assetValue: 260, unitCost: 130, updatedAt: iso(subDays(today, 3)), expiry: iso(addDays(today, 120)) },
  { id: "STK-13", name: "Gutta Percha Points", category: "Endodontic", sku: "ZKS8112", vendor: "Sterilo Instruments", quantity: 0, reorderAt: 30, unit: "box", status: "OUT OF STOCK", assetValue: 0, unitCost: 18, updatedAt: iso(subDays(today, 6)), expiry: iso(addDays(today, 600)) },
  { id: "STK-14", name: "Nitrile Gloves (M)", category: "Consumable", sku: "ZKS8111", vendor: "Sterilo Instruments", quantity: 96, reorderAt: 120, unit: "box", status: "LOW STOCK", assetValue: 1440, unitCost: 15, updatedAt: iso(today), expiry: null },
  { id: "STK-15", name: "Whitening Gel 35%", category: "Cosmetic", sku: "ZKS8110", vendor: "Cahaya Dental", quantity: 64, reorderAt: 20, unit: "syringe", status: "IN STOCK", assetValue: 5120, unitCost: 80, updatedAt: iso(today), expiry: iso(addDays(today, 210)) },
];

/** Draft reorder basket the Stocks screen surfaces on its second tab. */
export const stockOrders = [
  { id: "SO-01", stockId: "STK-01", name: "Ambesol", vendor: "Barone LLC.", quantity: 30, unitCost: 6, status: "DRAFT", requestedBy: "Angela Reyes", requestedAt: iso(subDays(today, 1)) },
  { id: "SO-02", stockId: "STK-04", name: "Lidex", vendor: "Barone LLC.", quantity: 25, unitCost: 11, status: "DRAFT", requestedBy: "Angela Reyes", requestedAt: iso(subDays(today, 1)) },
  { id: "SO-03", stockId: "STK-13", name: "Gutta Percha Points", vendor: "Sterilo Instruments", quantity: 40, unitCost: 18, status: "SUBMITTED", requestedBy: "Drg Soap Mactavish", requestedAt: iso(subDays(today, 3)) },
  { id: "SO-04", stockId: "STK-11", name: "Dental Brush", vendor: "MedSupply Co.", quantity: 60, unitCost: 2, status: "SUBMITTED", requestedBy: "Nadia Prakoso", requestedAt: iso(subDays(today, 2)) },
  { id: "SO-05", stockId: "STK-12", name: "Charmflex Regular", vendor: "DentaLab Indonesia", quantity: 20, unitCost: 130, status: "APPROVED", requestedBy: "Nadia Prakoso", requestedAt: iso(subDays(today, 4)) },
];

/** Consumption events — how the assistant records what a case used. */
export const stockUsage = [
  { id: "SU-01", stockId: "STK-02", appointmentId: "RSVA1003", quantity: 2, at: stamp(today, "12:05:00"), by: "Angela Reyes" },
  { id: "SU-02", stockId: "STK-10", appointmentId: "RSVA1009", quantity: 5, at: stamp(today, "14:10:00"), by: "Angela Reyes" },
  { id: "SU-03", stockId: "STK-15", appointmentId: "RSVA1006", quantity: 1, at: stamp(today, "11:20:00"), by: "Tomas Iversen" },
];

/* ----------------------------------------------------------- peripherals */

export const peripherals = [
  { id: "PER-01", name: "Dental Chair Unit A", series: "Fona 1000 S", category: "Chair Unit", sku: "DC-A100", vendor: "Cahaya Dental", assignedTo: "Drg Soap Mactavish", room: "Room 1", purchaseDate: "2020-03-11", purchasePrice: 9800, invoiceNumber: "INV-88120", weight: 210, status: "Used", nextService: iso(addDays(today, 40)), tags: ["Room 1", "Hydraulic"], description: "Primary treatment chair with integrated scaler and light." },
  { id: "PER-02", name: "Dental Chair Unit B", series: "Fona 1000 S", category: "Chair Unit", sku: "DC-B100", vendor: "Cahaya Dental", assignedTo: "Drg Jerald O'Hara", room: "Room 2", purchaseDate: "2020-03-11", purchasePrice: 9800, invoiceNumber: "INV-88121", weight: 210, status: "Used", nextService: iso(addDays(today, 40)), tags: ["Room 2", "Hydraulic"], description: "Secondary treatment chair, shared between part-time dentists." },
  { id: "PER-03", name: "Panoramic X-Ray", series: "Vatech PaX-i", category: "Imaging", sku: "XR-2200", vendor: "Cahaya Dental", assignedTo: "Radiology Room", room: "Radiology", purchaseDate: "2021-07-02", purchasePrice: 24500, invoiceNumber: "INV-90341", weight: 130, status: "Used", nextService: iso(addDays(today, 12)), tags: ["Imaging", "Certified"], description: "Digital panoramic and cephalometric imaging system." },
  { id: "PER-04", name: "Autoclave Sterilizer", series: "Melag Vacuklav 24", category: "Sterilization", sku: "AC-1400", vendor: "Sterilo Instruments", assignedTo: "Sterilization Room", room: "Sterilisation", purchaseDate: "2019-11-25", purchasePrice: 5600, invoiceNumber: "INV-77102", weight: 62, status: "Used", nextService: iso(addDays(today, 4)), tags: ["Class B"], description: "Class B vacuum autoclave for instrument sterilization." },
  { id: "PER-05", name: "Intraoral Scanner", series: "Medit i700", category: "Imaging", sku: "IS-0700", vendor: "DentaLab Indonesia", assignedTo: "Drg Putri Larasati", room: "Room 3", purchaseDate: "2022-02-14", purchasePrice: 18900, invoiceNumber: "INV-91884", weight: 3, status: "Used", nextService: iso(addDays(today, 90)), tags: ["Digital", "Orthodontic"], description: "Wireless intraoral scanner for digital impressions." },
  { id: "PER-06", name: "Portable Suction Unit", series: "Aspira 30", category: "Support", sku: "SU-0300", vendor: "Sterilo Instruments", assignedTo: "Unassigned", room: null, purchaseDate: iso(subDays(today, 14)), purchasePrice: 4300, invoiceNumber: "INV-93110", weight: 18, status: "Draft", nextService: null, tags: ["Incoming"], description: "Ordered as a backup unit, awaiting delivery." },
  { id: "PER-07", name: "Curing Light", series: "Woodpecker iLed", category: "Handpiece", sku: "CL-0090", vendor: "DentaLab Indonesia", assignedTo: "Room 1", room: "Room 1", purchaseDate: "2021-01-08", purchasePrice: 380, invoiceNumber: "INV-80442", weight: 1, status: "Not Used", nextService: null, tags: ["Spare"], description: "Spare LED curing light kept in reserve." },
  { id: "PER-08", name: "Ultrasonic Bath", series: "Elmasonic S30", category: "Sterilization", sku: "UB-0300", vendor: "Sterilo Instruments", assignedTo: "Sterilization Room", room: "Sterilisation", purchaseDate: "2022-06-19", purchasePrice: 1450, invoiceNumber: "INV-92210", weight: 12, status: "Used", nextService: iso(addDays(today, 25)), tags: ["Pre-clean"], description: "Pre-cleaning bath used before autoclaving." },
];

/* ------------------------------------------------------------- lab cases */

export const labCases = [
  {
    id: "LAB-2041",
    patientId: "PT-1010",
    patientName: "Brooklyn Simmons",
    dentistId: "DNT-04",
    technicianId: "STF-05",
    type: "Veneer",
    teeth: [11, 12, 21, 22],
    shade: "A1",
    material: "Feldspathic porcelain",
    stage: "try_in",
    priority: "standard",
    sentAt: iso(subDays(today, 10)),
    dueAt: iso(addDays(today, 2)),
    labName: "In-house lab",
    cost: 480,
    notes: "Patient requested slightly brighter incisal third.",
    impression: "Digital scan — Medit i700",
  },
  {
    id: "LAB-2042",
    patientId: "PT-1011",
    patientName: "Bessie Cooper",
    dentistId: "DNT-04",
    technicianId: "STF-05",
    type: "Complete denture",
    teeth: [],
    shade: "A3",
    material: "Heat-cure acrylic",
    stage: "in_production",
    priority: "standard",
    sentAt: iso(subDays(today, 6)),
    dueAt: iso(addDays(today, 5)),
    labName: "In-house lab",
    cost: 320,
    notes: "Jaw relation recorded, awaiting wax try-in.",
    impression: "Custom tray — border moulded",
  },
  {
    id: "LAB-2043",
    patientId: "PT-1007",
    patientName: "Albert Flores",
    dentistId: "DNT-02",
    technicianId: "STF-05",
    type: "Crown",
    teeth: [36],
    shade: "A2",
    material: "Zirconia",
    stage: "sent",
    priority: "urgent",
    sentAt: iso(subDays(today, 1)),
    dueAt: iso(addDays(today, 6)),
    labName: "Cahaya Ceramics",
    cost: 260,
    notes: "Post-endodontic crown, minimal occlusal clearance.",
    impression: "Digital scan — Medit i700",
  },
  {
    id: "LAB-2044",
    patientId: "PT-1013",
    patientName: "Willie Jennie",
    dentistId: "DNT-03",
    technicianId: "STF-05",
    type: "Orthodontic retainer",
    teeth: [],
    shade: null,
    material: "Clear thermoplastic",
    stage: "returned",
    priority: "standard",
    sentAt: iso(subDays(today, 12)),
    dueAt: iso(subDays(today, 2)),
    labName: "In-house lab",
    cost: 90,
    notes: "Ready for collection.",
    impression: "Alginate",
  },
  {
    id: "LAB-2045",
    patientId: "PT-1001",
    patientName: "Christopher Smallwood",
    dentistId: "DNT-01",
    technicianId: "STF-05",
    type: "Night guard",
    teeth: [],
    shade: null,
    material: "Hard acrylic",
    stage: "remake",
    priority: "urgent",
    sentAt: iso(subDays(today, 20)),
    dueAt: iso(addDays(today, 1)),
    labName: "In-house lab",
    cost: 140,
    notes: "First guard rocked on posterior contacts — remake with new impression.",
    impression: "Alginate",
  },
];

/* ----------------------------------------------------- sterilisation log */

export const sterilizationCycles = [
  { id: "CY-8814", sterilizerId: "PER-04", cycleNumber: 8814, type: "B", startedAt: stamp(today, "07:40:00"), operator: "Angela Reyes", load: "Surgical kits ×4, handpieces ×6", chemicalIndicator: "pass", biologicalIndicator: "pass", result: "pass", temperature: 134, holdMinutes: 4, notes: "" },
  { id: "CY-8815", sterilizerId: "PER-04", cycleNumber: 8815, type: "B", startedAt: stamp(today, "10:15:00"), operator: "Angela Reyes", load: "Restorative kits ×8", chemicalIndicator: "pass", biologicalIndicator: null, result: "pass", temperature: 134, holdMinutes: 4, notes: "" },
  { id: "CY-8816", sterilizerId: "PER-04", cycleNumber: 8816, type: "B", startedAt: stamp(today, "13:05:00"), operator: "Tomas Iversen", load: "Extraction forceps ×5, elevators ×4", chemicalIndicator: "pass", biologicalIndicator: null, result: "pending", temperature: 134, holdMinutes: 4, notes: "Awaiting incubator read at 24 h" },
  { id: "CY-8813", sterilizerId: "PER-04", cycleNumber: 8813, type: "N", startedAt: stamp(subDays(today, 1), "16:30:00"), operator: "Tomas Iversen", load: "Unwrapped mirrors and probes", chemicalIndicator: "fail", biologicalIndicator: null, result: "fail", temperature: 121, holdMinutes: 15, notes: "Chamber overloaded — load reprocessed on cycle 8814." },
  { id: "CY-8812", sterilizerId: "PER-04", cycleNumber: 8812, type: "B", startedAt: stamp(subDays(today, 1), "08:00:00"), operator: "Angela Reyes", load: "Perio kits ×6", chemicalIndicator: "pass", biologicalIndicator: "pass", result: "pass", temperature: 134, holdMinutes: 4, notes: "Weekly spore test — negative." },
];

/** Rooms the assistant turns over between patients. */
export const rooms = [
  { id: "Room 1", dentistId: "DNT-01", status: "occupied", appointmentId: "RSVA1003", lastCleanedAt: stamp(today, "11:40:00"), nextPatientAt: "14:30" },
  { id: "Room 2", dentistId: "DNT-02", status: "turnover", appointmentId: null, lastCleanedAt: stamp(today, "12:35:00"), nextPatientAt: "15:00" },
  { id: "Room 3", dentistId: "DNT-03", status: "ready", appointmentId: null, lastCleanedAt: stamp(today, "13:10:00"), nextPatientAt: "14:00" },
  { id: "Room 4", dentistId: "DNT-04", status: "occupied", appointmentId: "RSVA1011", lastCleanedAt: stamp(today, "09:50:00"), nextPatientAt: "13:00" },
];

/* ------------------------------------------------------------ audit trail */

export const auditLog = [
  { id: "AUD-01", at: stamp(today, "14:22:00"), actor: "Drg Soap Mactavish", role: "dentist", action: "clinical.chart.update", entity: "PT-1001", detail: "Added planned restoration on tooth 34", ip: "10.0.4.21" },
  { id: "AUD-02", at: stamp(today, "13:58:00"), actor: "Mariem Johnson", role: "receptionist", action: "finance.payment.create", entity: "BILL00120", detail: "Cash payment $120.00 into Free Cash", ip: "10.0.4.11" },
  { id: "AUD-03", at: stamp(today, "12:04:00"), actor: "Angela Reyes", role: "assistant", action: "sterilization.cycle.log", entity: "CY-8816", detail: "Cycle 8816 recorded, result pending", ip: "10.0.4.33" },
  { id: "AUD-04", at: stamp(today, "11:12:00"), actor: "Priya Raman", role: "accountant", action: "finance.transfer", entity: "TRF-0091", detail: "$1,500.00 Free Cash → Treatment Fund", ip: "10.0.4.44" },
  { id: "AUD-05", at: stamp(today, "09:31:00"), actor: "Nadia Prakoso", role: "manager", action: "appointment.cancel", entity: "RSVA1008", detail: "Cancelled — patient rescheduled", ip: "10.0.4.09" },
  { id: "AUD-06", at: stamp(subDays(today, 1), "17:40:00"), actor: "Darrell Steward", role: "owner", action: "staff.permission.update", entity: "STF-04", detail: "Granted audit:view to Finance Officer", ip: "10.0.4.02" },
  { id: "AUD-07", at: stamp(subDays(today, 1), "15:05:00"), actor: "Drg Amara Voss", role: "dentist", action: "prescription.create", entity: "RX-1002", detail: "Amoxicillin 500 mg prophylaxis for PT-1011", ip: "10.0.4.27" },
];

/* -------------------------------------------------------------- support */

export const supportThreads = [
  {
    id: "SUP-01",
    subject: "Cannot print receipt from Bill #BILL00120",
    channel: "Email",
    requester: "Mariem Johnson",
    status: "OPEN",
    priority: "High",
    updatedAt: stamp(today, "09:12:00"),
    unread: 2,
    messages: [
      { id: "M1", from: "Mariem Johnson", me: false, at: stamp(today, "09:02:00"), body: "The print receipt button opens a blank window on the front desk PC." },
      { id: "M2", from: "Odenta Support", me: true, at: stamp(today, "09:12:00"), body: "Thanks for flagging. Could you confirm the browser and whether pop-ups are blocked?" },
    ],
  },
  {
    id: "SUP-02",
    subject: "Request: bulk export for patient list",
    channel: "In-app",
    requester: "Nadia Prakoso",
    status: "PENDING",
    priority: "Medium",
    updatedAt: stamp(subDays(today, 1), "15:40:00"),
    unread: 0,
    messages: [
      { id: "M1", from: "Nadia Prakoso", me: false, at: stamp(subDays(today, 1), "15:40:00"), body: "We need a CSV export of all active patients for the insurance audit." },
    ],
  },
  {
    id: "SUP-03",
    subject: "Stock alert threshold not triggering",
    channel: "Email",
    requester: "Angela Reyes",
    status: "RESOLVED",
    priority: "Low",
    updatedAt: stamp(subDays(today, 4), "11:05:00"),
    unread: 0,
    messages: [
      { id: "M1", from: "Angela Reyes", me: false, at: stamp(subDays(today, 5), "10:00:00"), body: "Ambesol hit zero without an alert being raised." },
      { id: "M2", from: "Odenta Support", me: true, at: stamp(subDays(today, 4), "11:05:00"), body: "Fixed — the reorder threshold was set to 0. It now reads 20." },
    ],
  },
];

export const helpArticles = [
  { id: "HLP-01", title: "Adding a patient to the waitlist", category: "Reservations", minutes: 3, roles: ["receptionist", "manager"] },
  { id: "HLP-02", title: "Completing a 4-step medical checkup", category: "Clinical", minutes: 6, roles: ["dentist", "assistant"] },
  { id: "HLP-03", title: "Splitting a bill across accounts", category: "Finance", minutes: 4, roles: ["accountant", "receptionist"] },
  { id: "HLP-04", title: "Setting stock reorder thresholds", category: "Inventory", minutes: 2, roles: ["assistant", "manager"] },
  { id: "HLP-05", title: "Recording a sterilisation cycle", category: "Infection control", minutes: 3, roles: ["assistant"] },
  { id: "HLP-06", title: "Reading the periodontal chart", category: "Clinical", minutes: 5, roles: ["dentist"] },
];
