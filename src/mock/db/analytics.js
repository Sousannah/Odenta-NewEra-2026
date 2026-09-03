export const cashflow = {
  total: 13232,
  change: 4.51,
  range: "January 2022 - December 2022",
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

export const patientsSplit = {
  newPatients: 21,
  returningPatients: 142,
  range: "This month",
};

export const popularTreatments = [
  { name: "Scaling Teeth", rating: 4.7 },
  { name: "Tooth Extraction", rating: 4.4 },
  { name: "General Checkup", rating: 4.6 },
];

export const stockAvailability = {
  totalAsset: 53000,
  totalProduct: 442,
  segments: [
    { name: "Available", value: 331, color: "#13CACA" },
    { name: "Low Stock", value: 78, color: "#FCB900" },
    { name: "Out of stock", value: 33, color: "#FE3D75" },
  ],
  lowStock: [
    { name: "Dental Brush", quantity: 3 },
    { name: "Charmflex Regular", quantity: 2 },
  ],
};

export const salesSummary = {
  revenue: { total: 154, change: -43 },
  profit: { total: 154, change: -43 },
  range: "1 May 2022 - 30 May 2022",
};

export const reportMetrics = {
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
  weekly: [
    { day: "Mon", appointments: 38, revenue: 9200 },
    { day: "Tue", appointments: 44, revenue: 11400 },
    { day: "Wed", appointments: 51, revenue: 13800 },
    { day: "Thu", appointments: 42, revenue: 12100 },
    { day: "Fri", appointments: 47, revenue: 14600 },
    { day: "Sat", appointments: 33, revenue: 10300 },
    { day: "Sun", appointments: 13, revenue: 4200 },
  ],
};
