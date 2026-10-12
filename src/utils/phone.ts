/**
 * Phone numbers are stored in international (E.164) format, e.g. "+13175550123".
 * Mira only supports US numbers for now.
 */

/** "(317) 555-0123" → "+13175550123", or null if it isn't a full US number */
export function toE164(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

/** "+13175550123" → "(317) 555-0123" */
export function formatPhone(e164: string): string {
  const digits = e164.replace(/\D/g, "").slice(-10);
  if (digits.length !== 10) return e164;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}
