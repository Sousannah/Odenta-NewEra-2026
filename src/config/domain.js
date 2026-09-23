/** Domain vocabulary shared by screens — independent of where data comes from. */

export const APPOINTMENT_STATUS = {
  registered: { label: "Registered", tone: "info", step: 0 },
  arrived: { label: "Arrived", tone: "brand", step: 1 },
  encounter: { label: "Encounter", tone: "warning", step: 2 },
  waiting: { label: "Waiting Payment", tone: "warning", step: 3 },
  finished: { label: "Finished", tone: "success", step: 4 },
  cancelled: { label: "Cancelled", tone: "danger", step: -1 },
  /**
   * Off the flow rather than at the end of it: a postponed visit is one the
   * clinic still intends to see, so it is not "cancelled", and it never
   * happened, so it is not "finished". It carries its own step so a progress
   * strip does not draw it as either.
   */
  postponed: { label: "Postponed", tone: "info", step: -1 },
  no_show: { label: "No show", tone: "neutral", step: -1 },
};

/** The order a visit moves through, used by status pickers and progress bars. */
export const APPOINTMENT_FLOW = ["registered", "arrived", "encounter", "waiting", "finished"];

/**
 * What a visit booked for `dateKey` should start as.
 *
 * A date in the past is being recorded, not scheduled — the visit happened and
 * somebody is writing it down afterwards, so it opens as finished rather than
 * as a patient the clinic is still expecting. Today and later open as
 * registered, because they have not happened yet.
 *
 * Registration is the one caller that treats *today* as finished too, and it
 * says so at the call site: the screening visit is the thing the desk is
 * standing in the middle of when they type the form.
 */
export const statusForVisitDate = (dateKey, today) =>
  String(dateKey) < String(today) ? "finished" : "registered";

export const TREATMENT_CATEGORIES = [
  "Medical",
  "Cosmetic",
  "Orthodontic",
  "Prosthodontic",
];

export const STOCK_STATUSES = ["IN STOCK", "LOW STOCK", "OUT OF STOCK"];

export const PURCHASE_STATUSES = ["DRAFT", "IN TRANSIT", "RECEIVED", "CANCELLED"];

export const ORAL_HYGIENE_QUESTIONS = [
  {
    id: "last-visit",
    question: "When did you make the latest dental visit?",
    options: ["Less than 3 months ago", "1 year ago", "More than 1 year ago", "I don't remember"],
  },
  {
    id: "care-start",
    question: "What time did you start dental care?",
    options: ["Teenager", "About 30 years old", "About 20 years old", "After 30 years old"],
  },
  {
    id: "brushing",
    question: "How many time, in a day, do you wash your teeth?",
    options: ["Never", "Twice", "Once", "3 times"],
  },
  {
    id: "mouthwash",
    question: "Do you use mouthwash?",
    options: ["Never", "Sometimes", "Once a day", "Twice a day"],
  },
  {
    id: "floss",
    question: "How often do you floss?",
    options: ["Never", "Weekly", "A few times a week", "Daily"],
  },
];

export const PLAN_DECLINE_REASONS = [
  "Doctor not allowed",
  "Patient not agree",
  "Not enough time",
];

export const TOOTH_DECLINE_REASONS = [
  "Condition not met",
  "Patient disagree",
  "Not enough time",
];
