export const BOOKING_STATUSES = [
  "requested",
  "accepted",
  "rejected",
  "in-progress",
  "completed",
  "cancelled",
];

// Ei status gulo "active" dhora hoy (duplicate request check-er jonno)
export const ACTIVE_STATUSES = ["requested", "accepted", "in-progress"];

// Technician kon status theke kon status-e jete pare
export const TECHNICIAN_TRANSITIONS = {
  requested: ["accepted", "rejected"],
  accepted: ["in-progress"],
  "in-progress": ["completed"],
};