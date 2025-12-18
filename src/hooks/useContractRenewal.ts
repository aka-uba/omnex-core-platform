import { useMutation, useQuery } from '@tanstack/react-query';
import type { Contract } from '@/modules/real-estate/types/contract';

const API_BASE = '/api/real-estate/contracts';

// Check contracts that need renewal
export function useContractsNeedingRenewal(daysAhead: number = 30) {
  return useQuery({
    queryKey: ['contracts-needing-renewal', daysAhead],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/renew/check?daysAhead=${daysAhead}`);
      if (!response.ok) {
        throw new Error('Failed to fetch contracts needing renewal');
      }
      const data = await response.json();
      return data.data as { contracts: Contract[]; count: number };
    },
  });
}

// Manual contract renewal
export function useRenewContract() {
  return useMutation({
    mutationFn: async (contractId: string) => {
      const response = await fetch(`${API_BASE}/renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to renew contract');
      }

      const data = await response.json();
      return data.data as { contract: Contract; renewed: boolean };
    },
  });
}

// Auto-renew contracts (scheduled task)
export function useAutoRenewContracts() {
  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_BASE}/auto-renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to auto-renew contracts');
      }

      const data = await response.json();
      return data.data as { renewed: number; failed: number; results: Array<{ contractId: string; success: boolean; error?: string; newContractId?: string }> };
    },
  });
}








