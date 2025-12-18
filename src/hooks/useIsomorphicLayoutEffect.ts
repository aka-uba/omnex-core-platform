'use client';

import { useEffect, useLayoutEffect } from 'react';

/**
 * useIsomorphicLayoutEffect
 * 
 * SSR-safe layout effect hook that uses useLayoutEffect on client
 * and useEffect on server to avoid warnings.
 * 
 * This is faster than useEffect because it runs synchronously
 * after DOM mutations but before browser paint.
 */
export const useIsomorphicLayoutEffect = typeof window !== 'undefined' 
  ? useLayoutEffect 
  : useEffect;








