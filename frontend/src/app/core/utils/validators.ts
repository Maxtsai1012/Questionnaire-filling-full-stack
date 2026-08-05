/**
 * Shared validation rules and normalization utilities.
 */

export const PATTERNS = {
  /** Chinese, English, and single spaces between words */
  NAME: /^[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFFA-Za-z]+(?: [\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFFA-Za-z]+)*$/,
  /** Taiwan mobile number: 09xx-xxx-xxx (10 digits starting with 09) */
  PHONE: /^09\d{8}$/,
  /** Standard email address pattern */
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;

/**
 * Strips whitespace and dashes from a phone number.
 */
export function normalizePhone(phone: string): string {
  return (phone || '').replace(/[\s-]/g, '');
}

/**
 * Normalizes name string by trimming leading/trailing spaces and compressing inner spaces.
 */
export function normalizeName(name: string): string {
  return (name || '').trim().replace(/\s+/g, ' ');
}
