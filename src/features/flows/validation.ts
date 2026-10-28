/** Validators return an error message, or null when the value is valid. */
export type Validator = (value: string) => string | null;

export const required =
  (message: string): Validator =>
  (value) =>
    value.trim() ? null : message;

export const anything: Validator = () => null;

/** Keeps digits only, max 10. Used as the onChange sanitiser so Backspace and editing stay natural. */
export function sanitizeMobile(value: string): string {
  return value.replace(/\D/g, '').slice(0, 10);
}

export const mobileNumber: Validator = (value) => {
  const digits = value.trim();
  if (!digits) return 'Please enter your mobile number.';
  if (!/^[0-9]{10}$/.test(digits)) return 'Please enter a valid 10-digit mobile number.';
  return null;
};

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Today's date in the visitor's local time as YYYY-MM-DD (the format of <input type="date">). */
export function todayISO(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export const dateNotInPast =
  (now: () => Date = () => new Date()): Validator =>
  (value) => {
    if (!value) return 'Please select your preferred date.';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'Please select a valid date.';
    if (value < todayISO(now())) return 'Please choose today or a future date.';
    return null;
  };

/** "2026-10-30" → "30 Oct 2026" (same format as the original message). */
export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
