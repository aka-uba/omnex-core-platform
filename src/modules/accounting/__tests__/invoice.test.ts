/**
 * Accounting Module - Invoice Tests (FAZ 2)
 * Unit tests for invoice-related functionality
 */

import { describe, it, expect } from 'vitest';
import { invoiceCreateSchema, invoiceUpdateSchema, invoiceItemSchema } from '../schemas/subscription.schema';

describe('Invoice Schema Validation', () => {
  it('should validate a valid invoice create input', () => {
    const validInput = {
      subscriptionId: '123e4567-e89b-12d3-a456-426614174000',
      invoiceNumber: 'INV-001',
      invoiceDate: '2025-01-01T00:00:00.000Z',
      dueDate: '2025-01-31T00:00:00.000Z',
      subtotal: 1000,
      totalAmount: 1180,
      items: [
        {
          name: 'Test Item',
          description: 'Test Item Description',
          quantity: 1,
          unitPrice: 1000,
          total: 1000,
        },
      ],
    };

    const result = invoiceCreateSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should reject invoice without required fields', () => {
    const invalidInput = {
      invoiceNumber: 'INV-001',
      // Missing required fields
    };

    const result = invoiceCreateSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should validate invoice update input', () => {
    const validUpdate = {
      status: 'paid',
      paidDate: '2025-01-15T00:00:00.000Z',
    };

    const result = invoiceUpdateSchema.safeParse(validUpdate);
    expect(result.success).toBe(true);
  });
});

