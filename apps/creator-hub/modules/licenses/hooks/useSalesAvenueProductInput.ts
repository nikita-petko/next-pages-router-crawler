import { useCallback, useRef, useState } from 'react';
import {
  resolveSalesAvenueProduct,
  type SalesAvenueProductType,
  type SalesAvenueSelection,
} from '../utils/salesAvenue';

const DEFAULT_DEBOUNCE_MS = 500;

function parseProductId(value: string): number | undefined {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) {
    return undefined;
  }
  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed <= 0 || String(parsed) !== trimmed) {
    return undefined;
  }
  return parsed;
}

export interface UseSalesAvenueProductInputOptions {
  universeId: number | null;
  productType: SalesAvenueProductType;
  resolvedId?: number;
  onResolved: (selection: SalesAvenueSelection | undefined) => void;
  onError?: (message: string | undefined) => void;
  onPendingChange?: (isPending: boolean) => void;
  debounceMs?: number;
}

export interface UseSalesAvenueProductInputResult {
  inputValue: string;
  handleChange: (newValue: string) => void;
  isLoading: boolean;
}

/**
 * Debounced numeric product ID input that resolves a typed game pass or developer product
 * within the selected experience universe.
 */
export function useSalesAvenueProductInput({
  universeId,
  productType,
  resolvedId,
  onResolved,
  onError,
  onPendingChange,
  debounceMs = DEFAULT_DEBOUNCE_MS,
}: UseSalesAvenueProductInputOptions): UseSalesAvenueProductInputResult {
  const [inputValue, setInputValue] = useState(resolvedId != null ? String(resolvedId) : '');
  const [isLoading, setIsLoading] = useState(false);
  const [prevResolvedId, setPrevResolvedId] = useState(resolvedId);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  if (!isLoading && resolvedId !== prevResolvedId) {
    setPrevResolvedId(resolvedId);
    setInputValue(resolvedId != null ? String(resolvedId) : '');
  }

  const handleChange = useCallback(
    (newValue: string) => {
      setInputValue(newValue);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }

      const trimmed = newValue.trim();
      if (!trimmed) {
        onError?.(undefined);
        onResolved(undefined);
        return;
      }

      const productId = parseProductId(trimmed);
      if (productId === undefined) {
        onError?.('invalid-product-id');
        onResolved(undefined);
        return;
      }

      if (universeId == null) {
        onResolved(undefined);
        return;
      }

      onError?.(undefined);

      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        const requestId = requestIdRef.current + 1;
        requestIdRef.current = requestId;
        setIsLoading(true);
        onPendingChange?.(true);
        void (async () => {
          try {
            const resolved = await resolveSalesAvenueProduct(universeId, productId, productType);
            if (requestIdRef.current !== requestId) {
              return;
            }
            if (resolved) {
              onError?.(undefined);
              onResolved(resolved);
            } else {
              onError?.('product-not-found');
              onResolved(undefined);
            }
          } catch {
            if (requestIdRef.current === requestId) {
              onError?.('product-not-found');
              onResolved(undefined);
            }
          } finally {
            if (requestIdRef.current === requestId) {
              setIsLoading(false);
              onPendingChange?.(false);
            }
          }
        })();
      }, debounceMs);
    },
    [debounceMs, onError, onPendingChange, onResolved, productType, universeId],
  );

  return { inputValue, handleChange, isLoading };
}
