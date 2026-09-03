import { format, subDays } from "date-fns";

const iso = (date) => format(date, "yyyy-MM-dd");
const today = new Date();

/* ---------------------------------------------------------- shared series */

export const cashflow = {
  total: 13232,
  change: 4.51,
  range: `${format(subDays(today, 335), "MMMM yyyy")} - ${format(today, "MMMM yyyy")}`,
  series: [
    { month: "JAN", value: 2100, total: 210897 },
    { month: "FEB", value: 2450, total: 268431 },
    { month: "MAR", value: 2380, total: 259112 },
    { month: "APR", value: 3900, total: 402350 },
    { month: "MAY", value: 4620, total: 512004 },
    { month: "JUN", value: 6480, total: 710897 },
    { month: "JUL", value: 5510, total: 604220 },
    { month: "AUG", value: 7320, total: 803441 },
    { month: "SEP", value: 7480, total: 819210 },
    { month: "OCT", value: 8010, total: 872331 },
    { month: "NOV", value: 8460, total: 921004 },
    { month: "DEC", value: 9640, total: 1042118 },
  ],
};

export const expenses = {
  total: 132.34,
  range: "Last 6 months",
  slices: [
    { name: "Internet", value: 45, amount: 113.64, color: "#7C5CFC" },
    { name: "Electricity", value: 26, amount: 113.64, color: "#8ECC97" },
    { name: "Trasactions", value: 22, amount: 113.64, color: "#3EC7F1" },
    { name: "Rental Cost", value: 8, amount: 113.64, color: "#FE3D75" },
    { name: "Foods", value: 3, amount: 42.1, color: "#FF8A4C" },
    { name: "Other", value: 2, amount: 21.4, color: "#FCB900" },
  ],
};

export const incomeExpense = {
  income: { total: 1412, change: 4.51 },
  expense: { total: 612.34, change: -2.41 },
  series: [
    { month: "JAN", income: 4700, expense: 1800 },
    { month: "FEB", income: 6100, expense: 3100 },
    { month: "MAR", income: 9400, expense: 3600 },
    { month: "APR", income: 5000, expense: 2400 },
    { month: "MAY", income: 6300, expense: 4600 },
    { month: "JUN", income: 6250, expense: 5100 },
  ],
};

export const patientsSplit = { newPatients: 21, returningPatients: 142, range: "This month" };

export const popularTreatments = [
  { name: "Scaling Teeth", rating: 4.7 },
  { name: "Tooth Extraction", rating: 4.4 },
  { name: "General Checkup", rating: 4.6 },
];

export const stockAvailability = {
  totalAsset: 10200323,
  totalProduct: 32,
  segments: [
    { name: "Available", value: 21, color: "#13CACA" },
    { name: "Low Stock", value: 5, color: "#FCB900" },
    { name: "Out of stock", value: 6, color: "#FE3D75" },
  ],
  lowStock: [
    { name: "Dental Brush", quantity: 3 },
    { name: "Charmflex Regular", quantity: 2 },
  ],
};

/* ------------------------------------------------------------- per role */

export const ownerDashboard = {
  kpis: {
    revenue: { total: 84210, change: 8.1 },
    profit: { total: 31840, change: 6.4 },
    chairUtilisation: { total: 78, change: 5.6 },
    activePatients: { total: 412, change: 3.9 },
  },
  cashflow,
  expenses,
  incomeExpense,
  patients: patientsSplit,
  popularTreatments,
  stock: stockAvailability,
  byDentist: [
    { name: "Mactavish", appointments: 92, revenue: 28400, utilisation: 84 },
    { name: "O'Hara", appointments: 71, revenue: 21100, utilisation: 76 },
    { name: "Larasati", appointments: 58, revenue: 19800, utilisation: 71 },
    { name: "Voss", appointments: 47, revenue: 14910, utilisation: 63 },
  ],
  branches: [
    { id: "CLN-01", name: "Avicena Clinic", revenue: 62410, appointments: 198, utilisation: 81 },
    { id: "CLN-02", name: "Avicena Downtown", revenue: 21800, appointments: 70, utilisation: 64 },
  ],
};

export const managerDashboard = {
  kpis: {
    todayAppointments: { total: 13, change: 8.3 },
    utilisation: { total: 78, change: 5.6 },
    noShowRate: { total: 7.7, change: -1.4 },
    openBills: { total: 4996, change: -3.2 },
  },
  coverage: [
    { dentist: "Drg Soap Mactavish", booked: 5, capacity: 8, gaps: 2 },
    { dentist: "Drg Jerald O'Hara", booked: 3, capacity: 8, gaps: 3 },
    { dentist: "Drg Putri Larasati", booked: 2, capacity: 6, gaps: 2 },
    { dentist: "Drg Amara Voss", booked: 3, capacity: 8, gaps: 4 },
  ],
  weekly: [
    { day: "Mon", appointments: 38, revenue: 9200 },
    { day: "Tue", appointments: 44, revenue: 11400 },
    { day: "Wed", appointments: 51, revenue: 13800 },
    { day: "Thu", appointments: 42, revenue: 12100 },
    { day: "Fri", appointments: 47, revenue: 14600 },
    { day: "Sat", appointments: 33, revenue: 10300 },
    { day: "Sun", appointments: 13, revenue: 4200 },
  ],
  stock: stockAvailability,
};

export const dentistDashboard = {
  kpis: {
    todayPatients: { total: 5, change: 0 },
    completed: { total: 1, change: 0 },
    plansAwaitingConsent: { total: 1, change: 0 },
    labCasesDue: { total: 2, change: 0 },
  },
  productionSeries: [
    { day: "Mon", production: 2400, target: 2600 },
    { day: "Tue", production: 3100, target: 2600 },
    { day: "Wed", production: 2800, target: 2600 },
    { day: "Thu", production: 2200, target: 2600 },
    { day: "Fri", production: 3400, target: 2600 },
  ],
  caseMix: [
    { name: "Restorative", value: 38 },
    { name: "Endodontics", value: 21 },
    { name: "Preventive", value: 18 },
    { name: "Surgery", value: 12 },
    { name: "Prosthodontics", value: 7 },
  ],
};

export const assistantDashboard = {
  kpis: {
    roomsToTurn: { total: 1, change: 0 },
    cyclesToday: { total: 3, change: 0 },
    lowStockItems: { total: 4, change: 0 },
    pendingSporeTest: { total: 1, change: 0 },
  },
};

export const receptionDashboard = {
  kpis: {
    arrivalsToday: { total: 13, change: 0 },
    checkedIn: { total: 6, change: 0 },
    waitlist: { total: 3, change: 0 },
    outstanding: { total: 4996, change: -3.2 },
  },
  hourlyArrivals: [
    { hour: "08", booked: 1, arrived: 0 },
    { hour: "09", booked: 2, arrived: 2 },
    { hour: "10", booked: 2, arrived: 2 },
    { hour: "11", booked: 1, arrived: 1 },
    { hour: "12", booked: 1, arrived: 1 },
    { hour: "13", booked: 1, arrived: 0 },
    { hour: "14", booked: 2, arrived: 1 },
    { hour: "15", booked: 1, arrived: 1 },
    { hour: "16", booked: 2, arrived: 0 },
    { hour: "17", booked: 1, arrived: 0 },
  ],
};

export const accountantDashboard = {
  kpis: {
    revenue: { total: 24310, change: 12.4 },
    collected: { total: 3547, change: 5.6 },
    outstanding: { total: 4996, change: -3.2 },
    purchases: { total: 7050, change: 2.8 },
  },
  incomeExpense,
  expenses,
  ageing: [
    { bucket: "0–30 days", value: 2841 },
    { bucket: "31–60 days", value: 1320 },
    { bucket: "61–90 days", value: 560 },
    { bucket: "90+ days", value: 275 },
  ],
};

export const labDashboard = {
  kpis: {
    openCases: { total: 4, change: 0 },
    dueThisWeek: { total: 3, change: 0 },
    remakes: { total: 1, change: 0 },
    turnaroundDays: { total: 6.4, change: -0.6 },
  },
  byType: [
    { name: "Crown", value: 12 },
    { name: "Denture", value: 8 },
    { name: "Veneer", value: 6 },
    { name: "Retainer", value: 5 },
    { name: "Night guard", value: 3 },
  ],
};

/* ------------------------------------------------------------- reporting */

export const reportMetrics = {
  generatedAt: iso(today),
  appointments: { total: 268, change: 12.4 },
  revenue: { total: 84210, change: 8.1 },
  newPatients: { total: 63, change: -3.2 },
  utilisation: { total: 78, change: 5.6 },
  byTreatment: [
    { name: "Scaling", value: 82 },
    { name: "Filling", value: 64 },
    { name: "Checkup", value: 58 },
    { name: "Extraction", value: 34 },
    { name: "Braces", value: 18 },
    { name: "Veneer", value: 12 },
  ],
  byDentist: [
    { name: "Mactavish", appointments: 92, revenue: 28400 },
    { name: "O'Hara", appointments: 71, revenue: 21100 },
    { name: "Larasati", appointments: 58, revenue: 19800 },
    { name: "Voss", appointments: 47, revenue: 14910 },
  ],
  weekly: managerDashboard.weekly,
  clinical: {
    cariesRiskSplit: [
      { name: "Low", value: 168, color: "#47B889" },
      { name: "Moderate", value: 142, color: "#61B1FF" },
      { name: "High", value: 84, color: "#F7BA21" },
      { name: "Extreme", value: 18, color: "#E45689" },
    ],
    recallCompliance: 72,
    perioStages: [
      { name: "Stage I", value: 46 },
      { name: "Stage II", value: 38 },
      { name: "Stage III", value: 21 },
      { name: "Stage IV", value: 7 },
    ],
  },
};
