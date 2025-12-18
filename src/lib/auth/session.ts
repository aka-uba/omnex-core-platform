/**
 * Session Management Utilities
 * Handles cookie-based session creation, validation, and deletion
 */

import { cookies } from 'next/headers';

export interface Session {
    sessionId: string;
    userId: string;
    tenantSlug: string;
    createdAt: Date;
    expiresAt: Date;
}

// In-memory session store (for development)
// In production, use Redis or database
const sessionStore = new Map<string, Session>();

// Session configuration
const SESSION_COOKIE_NAME = 'omnex-session';
const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

/**
 * Generate a random session ID
 */
function generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Create a new session
 * Returns session ID
 */
export async function createSession(userId: string, tenantSlug: string): Promise<string> {
    const sessionId = generateSessionId();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_MAX_AGE * 1000);

    const session: Session = {
        sessionId,
        userId,
        tenantSlug,
        createdAt: now,
        expiresAt,
    };

    // Store session
    sessionStore.set(sessionId, session);

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: SESSION_MAX_AGE,
        path: '/',
    });

    return sessionId;
}

/**
 * Get session by ID
 * Returns session if valid, null if not found or expired
 */
export async function getSession(sessionId: string): Promise<Session | null> {
    const session = sessionStore.get(sessionId);

    if (!session) {
        return null;
    }

    // Check if expired
    if (new Date() > session.expiresAt) {
        sessionStore.delete(sessionId);
        return null;
    }

    return session;
}

/**
 * Get session from cookies
 */
export async function getSessionFromCookies(): Promise<Session | null> {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionId) {
        return null;
    }

    return getSession(sessionId);
}

/**
 * Delete session
 */
export async function deleteSession(sessionId: string): Promise<void> {
    sessionStore.delete(sessionId);

    // Clear cookie
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Delete session from cookies
 */
export async function deleteSessionFromCookies(): Promise<void> {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (sessionId) {
        sessionStore.delete(sessionId);
    }

    cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Validate session
 * Returns true if session is valid and not expired
 */
export async function validateSession(sessionId: string): Promise<boolean> {
    const session = await getSession(sessionId);
    return session !== null;
}

/**
 * Clean up expired sessions (should be run periodically)
 */
export function cleanupExpiredSessions(): void {
    const now = new Date();

    for (const [sessionId, session] of sessionStore.entries()) {
        if (now > session.expiresAt) {
            sessionStore.delete(sessionId);
        }
    }
}

// Run cleanup every hour
if (typeof window === 'undefined') {
    setInterval(cleanupExpiredSessions, 60 * 60 * 1000);
}
