/**
 * Error Utilities
 * Modül bağımsızlığı için shared error handling utilities
 */

/**
 * Error'dan string mesaj çıkar
 * Modül bağımsızlığı için safe error handling
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return 'Unknown error';
}

/**
 * Error'dan detaylı bilgi çıkar (development için)
 */
export function getErrorDetails(error: unknown): {
  message: string;
  stack?: string;
  name?: string;
} {
  if (error instanceof Error) {
    return {
      message: error.message,
      ...(error.stack ? { stack: error.stack } : {}),
      ...(error.name ? { name: error.name } : {}),
    };
  }
  return {
    message: getErrorMessage(error),
  };
}

/**
 * Database connection error kontrolü
 */
export function isDatabaseConnectionError(error: unknown): boolean {
  const message = getErrorMessage(error);
  return (
    message.includes("Can't reach database server") ||
    message.includes('localhost:5432') ||
    message.includes('ECONNREFUSED') ||
    message.includes('Connection refused')
  );
}

/**
 * Validation error kontrolü
 */
export function isValidationError(error: unknown): boolean {
  const message = getErrorMessage(error);
  return (
    message.includes('validation') ||
    message.includes('Validation') ||
    message.includes('invalid') ||
    message.includes('required')
  );
}













