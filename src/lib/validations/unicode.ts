/**
 * Unicode-safe validation helpers
 * Supports international characters including:
 * - Turkish: ç, ğ, ı, ö, ş, ü, Ç, Ğ, İ, Ö, Ş, Ü
 * - German: ä, ö, ü, ß, Ä, Ö, Ü
 * - Arabic: ء-ي
 * - And all other Unicode letters
 */

import { z } from 'zod';

/**
 * Regex pattern that matches any Unicode letter
 * This includes all international characters from any language
 */
export const UNICODE_LETTER_PATTERN = /\p{L}/u;

/**
 * Regex pattern for names (supports all Unicode letters, spaces, hyphens, apostrophes)
 * Examples: "Müller", "O'Brien", "Jean-Pierre", "Şükrü", "محمد"
 */
export const NAME_PATTERN = /^[\p{L}\p{M}\s\-'\.]+$/u;

/**
 * Regex pattern for addresses (supports all Unicode letters, numbers, spaces, common punctuation)
 * Examples: "Königstraße 123", "Şehit Caddesi No:45", "شارع الملك"
 */
export const ADDRESS_PATTERN = /^[\p{L}\p{M}\p{N}\s\-'.,:/# ]+$/u;

/**
 * Regex pattern for general text (very permissive - most printable characters)
 */
export const TEXT_PATTERN = /^[\p{L}\p{M}\p{N}\p{P}\p{S}\p{Z}]+$/u;

/**
 * Regex pattern for folder/file names (supports Unicode letters, numbers, spaces, hyphens, underscores)
 * More permissive than ASCII-only but still safe for file systems
 */
export const FOLDER_NAME_PATTERN = /^[\p{L}\p{M}\p{N}\s\-_\.]+$/u;

/**
 * Check if a string contains only valid name characters (international support)
 */
export function isValidName(value: string): boolean {
  if (!value || value.trim() === '') return false;
  return NAME_PATTERN.test(value.trim());
}

/**
 * Check if a string contains only valid address characters (international support)
 */
export function isValidAddress(value: string): boolean {
  if (!value || value.trim() === '') return false;
  return ADDRESS_PATTERN.test(value.trim());
}

/**
 * Check if a string is a valid folder name (international support)
 */
export function isValidFolderName(value: string): boolean {
  if (!value || value.trim() === '') return false;
  // Also check for reserved characters that could cause issues
  const reserved = /[<>:"|?*\\\/]/;
  if (reserved.test(value)) return false;
  return FOLDER_NAME_PATTERN.test(value.trim());
}

/**
 * Sanitize a string for use as a filename while preserving Unicode characters
 * Only removes truly problematic characters for file systems
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return '';

  // Remove only characters that are problematic for file systems
  // Keep Unicode letters, numbers, spaces, hyphens, underscores, dots
  return filename
    .replace(/[<>:"|?*\\\/\x00-\x1f]/g, '') // Remove control chars and reserved
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
}

/**
 * Zod schema for names with international character support
 */
export const unicodeNameSchema = z
  .string()
  .min(1, 'Name is required')
  .refine((val) => NAME_PATTERN.test(val.trim()), {
    message: 'Name contains invalid characters',
  });

/**
 * Zod schema for optional names with international character support
 */
export const optionalUnicodeNameSchema = z
  .string()
  .optional()
  .nullable()
  .refine((val) => !val || NAME_PATTERN.test(val.trim()), {
    message: 'Name contains invalid characters',
  });

/**
 * Zod schema for addresses with international character support
 */
export const unicodeAddressSchema = z
  .string()
  .min(1, 'Address is required')
  .refine((val) => ADDRESS_PATTERN.test(val.trim()), {
    message: 'Address contains invalid characters',
  });

/**
 * Zod schema for folder names with international character support
 */
export const unicodeFolderNameSchema = z
  .string()
  .min(1, 'Folder name is required')
  .max(255, 'Folder name is too long')
  .refine((val) => isValidFolderName(val), {
    message: 'Folder name contains invalid characters',
  });

/**
 * Convert Turkish-specific characters to ASCII equivalents
 * Use this only when ASCII is strictly required (e.g., database names, URLs)
 */
export function convertToASCII(str: string): string {
  const turkishMap: Record<string, string> = {
    'ç': 'c', 'Ç': 'C',
    'ğ': 'g', 'Ğ': 'G',
    'ı': 'i', 'İ': 'I',
    'ö': 'o', 'Ö': 'O',
    'ş': 's', 'Ş': 'S',
    'ü': 'u', 'Ü': 'U',
    'ä': 'a', 'Ä': 'A',
    'ß': 'ss',
  };

  return str.replace(/[çÇğĞıİöÖşŞüÜäÄß]/g, (char) => turkishMap[char] || char);
}

/**
 * Normalize a string for safe comparison (lowercase, trim, normalize unicode)
 */
export function normalizeForComparison(str: string): string {
  if (!str) return '';
  return str.normalize('NFC').toLowerCase().trim();
}

export default {
  NAME_PATTERN,
  ADDRESS_PATTERN,
  TEXT_PATTERN,
  FOLDER_NAME_PATTERN,
  isValidName,
  isValidAddress,
  isValidFolderName,
  sanitizeFilename,
  unicodeNameSchema,
  optionalUnicodeNameSchema,
  unicodeAddressSchema,
  unicodeFolderNameSchema,
  convertToASCII,
  normalizeForComparison,
};
