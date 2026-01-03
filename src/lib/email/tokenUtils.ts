import crypto from 'crypto';

/**
 * Generate a secure random token
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate a 6-digit numeric code
 */
export function generateNumericCode(length: number = 6): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
}

/**
 * Calculate token expiry date
 */
export function getTokenExpiry(hours: number = 24): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + hours);
  return expiry;
}

/**
 * Calculate token expiry date in minutes
 */
export function getTokenExpiryMinutes(minutes: number = 60): Date {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + minutes);
  return expiry;
}

/**
 * Check if token is expired
 */
export function isTokenExpired(expiryDate: Date | null | undefined): boolean {
  if (!expiryDate) return true;
  return new Date() > new Date(expiryDate);
}

/**
 * Hash a token for secure storage (optional)
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Build activation URL
 */
export function buildActivationUrl(
  baseUrl: string,
  token: string,
  locale: string = 'tr'
): string {
  return `${baseUrl}/${locale}/auth/activate?token=${encodeURIComponent(token)}`;
}

/**
 * Build password reset URL
 */
export function buildPasswordResetUrl(
  baseUrl: string,
  token: string,
  locale: string = 'tr'
): string {
  return `${baseUrl}/${locale}/auth/reset-password?token=${encodeURIComponent(token)}`;
}

/**
 * Get base URL from request or environment
 */
export function getBaseUrl(request?: Request): string {
  if (request) {
    const url = new URL(request.url);
    return `${url.protocol}//${url.host}`;
  }

  // Fallback to environment variable or default
  return process.env.NEXT_PUBLIC_APP_URL ||
         process.env.NEXTAUTH_URL ||
         'http://localhost:3000';
}
