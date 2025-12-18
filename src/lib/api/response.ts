/**
 * Standardized API Response Utilities
 * Provides consistent response format across all API endpoints
 */

import { NextResponse } from 'next/server';

/**
 * Standard API Response Interface
 */
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        timestamp: string;
    };
}

/**
 * Success Response
 * Returns a standardized success response
 */
export function successResponse<T>(
    data: T,
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
    },
    status: number = 200
): NextResponse<ApiResponse<T>> {
    const response: ApiResponse<T> = {
        success: true,
        data,
        meta: {
            ...meta,
            timestamp: new Date().toISOString(),
        },
    };

    return NextResponse.json(response, { status });
}

/**
 * Error Response
 * Returns a standardized error response
 */
export function errorResponse(
    code: string,
    message: string,
    details?: any,
    status: number = 400
): NextResponse<ApiResponse> {
    const response: ApiResponse = {
        success: false,
        error: {
            code,
            message,
            details,
        },
        meta: {
            timestamp: new Date().toISOString(),
        },
    };

    return NextResponse.json(response, { status });
}

/**
 * Validation Error Response
 * Returns a standardized validation error response
 */
export function validationErrorResponse(
    message: string,
    errors: any
): NextResponse<ApiResponse> {
    return errorResponse('VALIDATION_ERROR', message, errors, 400);
}

/**
 * Not Found Response
 * Returns a standardized not found response
 */
export function notFoundResponse(
    resource: string = 'Resource'
): NextResponse<ApiResponse> {
    return errorResponse('NOT_FOUND', `${resource} not found`, null, 404);
}

/**
 * Unauthorized Response
 * Returns a standardized unauthorized response
 */
export function unauthorizedResponse(
    message: string = 'Unauthorized'
): NextResponse<ApiResponse> {
    return errorResponse('UNAUTHORIZED', message, null, 401);
}

/**
 * Forbidden Response
 * Returns a standardized forbidden response
 */
export function forbiddenResponse(
    message: string = 'Forbidden'
): NextResponse<ApiResponse> {
    return errorResponse('FORBIDDEN', message, null, 403);
}

/**
 * Rate Limit Response
 * Returns a standardized rate limit exceeded response
 */
export function rateLimitResponse(
    retryAfter?: number
): NextResponse<ApiResponse> {
    const response = errorResponse(
        'RATE_LIMIT_EXCEEDED',
        'Too many requests. Please try again later.',
        retryAfter ? { retryAfter } : null,
        429
    );

    if (retryAfter) {
        response.headers.set('Retry-After', retryAfter.toString());
    }

    return response;
}

/**
 * Internal Server Error Response
 * Returns a standardized internal server error response
 */
export function internalErrorResponse(
    message: string = 'Internal server error'
): NextResponse<ApiResponse> {
    return errorResponse('INTERNAL_ERROR', message, null, 500);
}

/**
 * Paginated Response
 * Returns a standardized paginated response
 */
export function paginatedResponse<T>(
    data: T[],
    page: number,
    limit: number,
    total: number
): NextResponse<ApiResponse<T[]>> {
    return successResponse(data, {
        page,
        limit,
        total,
    });
}
