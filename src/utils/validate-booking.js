const DAY = 24 * 60 * 60 * 1000;

// Error message return kore. Sob thik thakle null.
export function validateBookingInput(body = {}) {
  const phone = String(body.customerPhone || "").trim();
  const address = String(body.address || "").trim();
  const problem = String(body.problemDescription || "").trim();
  const dateStr = String(body.preferredDate || "").trim();

  if (!/^[0-9+\-\s]{7,16}$/.test(phone)) {
    return "Enter a valid phone number";
  }
  if (address.length < 5) {
    return "Address must be at least 5 characters";
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return "Preferred date is required";
  }

  const date = new Date(`${dateStr}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return "Preferred date is invalid";
  }

  // Aj ba bhobishyot hote hobe. 1 din tolerance dilam, karon
  // server UTC-te cholte pare ar Bangladesh UTC+6
  const todayUtc = Math.floor(Date.now() / DAY) * DAY;
  if (date.getTime() < todayUtc - DAY) {
    return "Preferred date must be today or a future date";
  }

  if (problem.length < 20) {
    return "Problem description must be at least 20 characters";
  }

  return null;
}