/**
 * Accounting Module - Subscription Tests (FAZ 2)
 * Unit tests for subscription-related functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { subscriptionCreateSchema, subscriptionUpdateSchema } from '../schemas/subscription.schema';

describe('Subscription Schema Validation', () => {
  it('should validate a valid subscription create input', () => {
    const validInput = {
      name: 'Test Subscription',
      type: 'rental',
      startDate: '2025-01-01T00:00:00.000Z',
      basePrice: 1000,
      currency: 'TRY',
      billingCycle: 'monthly',
    };

    const result = subscriptionCreateSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should reject invalid subscription type', () => {
    const invalidInput = {
      name: 'Test Subscription',
      type: 'invalid_type',
      startDate: '2025-01-01T00:00:00.000Z',
      basePrice: 1000,
      currency: 'TRY',
      billingCycle: 'monthly',
    };

    const result = subscriptionCreateSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should validate subscription update input', () => {
    const validUpdate = {
      name: 'Updated Subscription',
      status: 'active',
    };

    const result = subscriptionUpdateSchema.safeParse(validUpdate);
    expect(result.success).toBe(true);
  });
});

describe('Subscription Types', () => {
  it('should have correct subscription type enum values', () => {
    const validTypes = ['rental', 'subscription', 'commission'];
    validTypes.forEach((type) => {
      const result = subscriptionCreateSchema.safeParse({
        name: 'Test',
        type,
        startDate: '2025-01-01T00:00:00.000Z',
        basePrice: 1000,
        currency: 'TRY',
        billingCycle: 'monthly',
      });
      expect(result.success).toBe(true);
    });
  });
});







