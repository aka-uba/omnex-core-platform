/**
 * Core Prisma Client
 * 
 * Core database (platform yönetimi, tenant metadata) için Prisma client
 */

import { PrismaClient as CorePrismaClient } from '@prisma/core-client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForCorePrisma = globalThis as unknown as {
  corePrisma: CorePrismaClient | undefined;
};

export const corePrisma =
  globalForCorePrisma.corePrisma ??
  new CorePrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error'] : ['error'], // Disabled query logging for performance
  });

// Always use singleton in both development AND production
// to prevent connection pool exhaustion and memory leaks
globalForCorePrisma.corePrisma = corePrisma;


