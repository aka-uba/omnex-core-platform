/**
 * API Error Handler
 * Centralized error handling for API routes
 * Modül bağımsızlığı için shared error handler
 */

import { NextResponse } from 'next/server';
import { getErrorMessage, isDatabaseConnectionError } from '@/lib/utils/error';
import { logger } from '@/lib/utils/logger';

export interface ApiErrorResponse {
  success: false;
  error: string;
  message: string;
  details?: string;
}

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data?: T;
  message?: string;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Handle API errors and return appropriate response
 */
export function handleApiError(
  error: unknown,
  defaultMessage: string = 'An error occurred',
  module?: string
): NextResponse<ApiErrorResponse> {
  const errorMessage = getErrorMessage(error);
  
  // Log error
  logger.error(defaultMessage, error, module);

  // Database connection errors
  if (isDatabaseConnectionError(error)) {
    return NextResponse.json<ApiErrorResponse>(
      {
        success: false,
        error: 'Database connection failed',
        message: 'Cannot connect to database server. Please make sure PostgreSQL is running.',
        ...(process.env.NODE_ENV === 'development' && errorMessage ? { details: errorMessage } : {}),
      },
      { status: 503 } // Service Unavailable
    );
  }

  // Validation errors
  if (errorMessage.toLowerCase().includes('validation') || errorMessage.toLowerCase().includes('invalid')) {
    return NextResponse.json<ApiErrorResponse>(
      {
        success: false,
        error: 'Validation error',
        message: errorMessage,
      },
      { status: 400 } // Bad Request
    );
  }

  // Not found errors
  if (errorMessage.toLowerCase().includes('not found') || errorMessage.toLowerCase().includes('does not exist')) {
    return NextResponse.json<ApiErrorResponse>(
      {
        success: false,
        error: 'Not found',
        message: errorMessage,
      },
      { status: 404 }
    );
  }

  // Unauthorized errors
  if (errorMessage.toLowerCase().includes('unauthorized') || errorMessage.toLowerCase().includes('forbidden')) {
    return NextResponse.json<ApiErrorResponse>(
      {
        success: false,
        error: 'Unauthorized',
        message: errorMessage,
      },
      { status: 401 }
    );
  }

  // Default error response
  return NextResponse.json<ApiErrorResponse>(
    {
      success: false,
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? errorMessage : defaultMessage,
      ...(process.env.NODE_ENV === 'development' && error instanceof Error && error.stack ? { details: error.stack } : {}),
    },
    { status: 500 }
  );
}

/**
 * Create success response
 */
export function successResponse<T>(
  data?: T,
  message?: string
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json<ApiSuccessResponse<T>>(
    {
      success: true,
      ...(data !== undefined ? { data } : {}),
      ...(message ? { message } : {}),
    },
    { status: 200 }
  );
}

/**
 * Create error response (for manual error cases)
 */
export function errorResponse(
  error: string,
  message: string,
  status: number = 400,
  details?: string
): NextResponse<ApiErrorResponse> {
  return NextResponse.json<ApiErrorResponse>(
    {
      success: false,
      error,
      message,
      // Always include details if provided (not just in development)
      ...(details ? { details } : {}),
    },
    { status }
  );
}













