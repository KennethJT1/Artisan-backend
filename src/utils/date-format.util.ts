// src/utils/date-format.util.ts

/**
 * Format a date as DD/M/YYYY (e.g., 30/5/2026)
 * @param date Date, string, or number
 * @returns string in DD/M/YYYY format
 */
export function formatDate(date: Date | string | number): string {
  const d = new Date(date);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}
