/**
 * Password Utilities
 * Secure password hashing and verification
 * Modül bağımsızlığı için standalone utility
 */

import bcrypt from 'bcryptjs';

/**
 * Hash a password
 * @param password Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.trim().length === 0) {
    throw new Error('Password cannot be empty');
  }

  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }

  const saltRounds = 12; // Higher security
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against a hash
 * @param password Plain text password
 * @param hash Hashed password
 * @returns True if password matches
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) {
    return false;
  }

  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

/**
 * Check if a string is already hashed (basic check)
 */
export function isHashed(value: string): boolean {
  // bcrypt hashes start with $2a$, $2b$, or $2y$ and are 60 characters long
  return /^\$2[ayb]\$.{56}$/.test(value);
}













