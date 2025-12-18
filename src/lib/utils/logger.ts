/**
 * Logger Utility
 * Production-safe logging with environment detection
 * Modül bağımsızlığı için shared logger
 */

const isDev = process.env.NODE_ENV === 'development';

export type LogLevel = 'log' | 'error' | 'warn' | 'debug' | 'info';

interface LogOptions {
  level?: LogLevel;
  module?: string;
  context?: Record<string, unknown>;
}

/**
 * Safe logger - only logs in development or errors in production
 */
class Logger {
  private formatMessage(level: LogLevel, message: string, options?: LogOptions): string {
    const prefix = options?.module ? `[${options.module}]` : '';
    return `${prefix} ${message}`.trim();
  }

  private logInternal(level: LogLevel, message: string, options?: LogOptions): void {
    // Always log errors, even in production
    if (level === 'error') {
      console.error(this.formatMessage(level, message, options), options?.context || '');
      return;
    }

    // Only log other levels in development
    if (!isDev) {
      return;
    }

    const formattedMessage = this.formatMessage(level, message, options);
    
    switch (level) {
      case 'warn':
        console.warn(formattedMessage, options?.context || '');
        break;
      case 'debug':
        console.debug(formattedMessage, options?.context || '');
        break;
      case 'info':
        console.info(formattedMessage, options?.context || '');
        break;
      default:
        console.log(formattedMessage, options?.context || '');
    }
  }

  log(message: string, context?: Record<string, unknown>, module?: string): void {
    this.logInternal('log', message, {
      ...(context ? { context } : {}),
      ...(module ? { module } : {}),
    });
  }

  error(message: string, error?: unknown, module?: string, context?: Record<string, unknown>): void {
    const errorContext = error ? { error: error instanceof Error ? error.message : String(error) } : undefined;
    const mergedContext = context ? { ...errorContext, ...context } : errorContext;
    this.logInternal('error', message, {
      ...(mergedContext ? { context: mergedContext } : {}),
      ...(module ? { module } : {}),
    });
  }

  warn(message: string, context?: Record<string, unknown>, module?: string): void {
    this.logInternal('warn', message, {
      ...(context ? { context } : {}),
      ...(module ? { module } : {}),
    });
  }

  debug(message: string, context?: Record<string, unknown>, module?: string): void {
    this.logInternal('debug', message, {
      ...(context ? { context } : {}),
      ...(module ? { module } : {}),
    });
  }

  info(message: string, context?: Record<string, unknown>, module?: string): void {
    this.logInternal('info', message, {
      ...(context ? { context } : {}),
      ...(module ? { module } : {}),
    });
  }
}

// Singleton instance
export const logger = new Logger();

// Convenience exports for direct use
export const log = logger.log.bind(logger);
export const logError = logger.error.bind(logger);
export const logWarn = logger.warn.bind(logger);
export const logDebug = logger.debug.bind(logger);
export const logInfo = logger.info.bind(logger);

