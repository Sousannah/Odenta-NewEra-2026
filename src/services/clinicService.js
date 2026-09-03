import * as db from "@/mock";
import { respond, search } from "./http.mock";

/* ------------------------------------------------------------------ clinic */

export const getClinic = () => respond(db.clinic);
export const getCurrentUser = () => respond(db.currentUser);

/* ---------------------------------------------------------------- patients */

export const getPatients = ({ status = "active", query = "" } = {}) => {
  const rows = db.patients.filter((p) => (status === "all" ? true : p.status === status));
  return respond(search(rows, query, ["name", "email", "phone", "id", "address"]));
};

export const getPatientById = (id) =>
  respond(db.patients.find((p) => p.id === id) ?? null);

/* ------------------------------------------------------------------- staff */

export const getStaff = ({ role = "all", query = "" } = {}) => {
  const rows =
    role === "dentist"
      ? db.dentists
      : role === "general"
        ? db.generalStaff
        : db.staffList;
  return respond(search(rows, query, ["name", "email", "role", "speciality"]));
};

export const getDentists = () => respond(db.dentists);

/* -------------------------------------------------------------- treatments */

export const getTreatments = ({ category = "all", query = "" } = {}) => {
  const rows =
    category === "all"
      ? db.treatments
      : db.treatments.filter((t) => t.category === category);
  return respond(search(rows, query, ["name", "category", "description"]));
};

export const getToothConditions = () => respond(db.toothConditions);
export const getToothActions = () => respond(db.toothActions);

/* ------------------------------------------------------------ reservations */

export const getReservations = ({ dentistId = "all" } = {}) => {
  const rows =
    dentistId === "all"
      ? db.reservations
      : db.reservations.filter((r) => r.dentistId === dentistId);
  return respond(rows);
};

export const getReservationById = (id) =>
  respond(db.reservations.find((r) => r.id === id) ?? null);

export const getTreatmentPlans = (patientId) =>
  respond(db.treatmentPlans.filter((p) => !patientId || p.patientId === patientId));

export const getAttachments = (reservationId) =>
  respond(db.attachments.filter((a) => !reservationId || a.reservationId === reservationId));

export const getDentalRecord = (patientId) =>
  respond(db.dentalRecords[patientId] ?? { medical: [], cosmetic: [] });

export const getLogHistory = () => respond(db.logHistory);

/* --------------------------------------------------------------- inventory */

export const getStocks = ({ status = "all", query = "" } = {}) => {
  const rows = status === "all" ? db.stocks : db.stocks.filter((s) => s.status === status);
  return respond(search(rows, query, ["name", "sku", "vendor", "category"]));
};

export const getPeripherals = ({ status = "all", query = "" } = {}) => {
  const rows =
    status === "all" ? db.peripherals : db.peripherals.filter((p) => p.status === status);
  return respond(search(rows, query, ["name", "sku", "vendor", "category", "assignedTo"]));
};

/* ----------------------------------------------------------------- support */

export const getSupportThreads = () => respond(db.supportThreads);
export const getHelpArticles = () => respond(db.helpArticles);
