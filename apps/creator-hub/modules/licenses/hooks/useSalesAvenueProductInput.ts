import { useCallback, useEffect, useRef, useState } from 'react';
import {
  resolveSalesAvenueProduct,
  type SalesAvenueProductType,
  type SalesAvenueSelection,
} from '../utils/salesAvenue';

function parseProductId(value: string): number | undefined {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) {
    return undefined;
  }
  const parsed = Number(trimmed);
  if (!Number.isSafeInteger(parsed) || parsed <= 0 || String(parsed) !== trimmed) {
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
}

export interface UseSalesAvenueProductInputResult {
  inputValue: string;
  handleChange: (newValue: string) => void;
  handleSubmit: () => void;
  isLoading: boolean;
}

/**
 * Numeric product ID input that resolves a game pass or developer product within the
 * selected experience universe when explicitly submitted.
 */
export function useSalesAvenueProductInput({
  universeId,
  productType,
  resolvedId,
  onResolved,
  onError,
  onPendingChange,
}: UseSalesAvenueProductInputOptions): UseSalesAvenueProductInputResult {
  const [inputValue, setInputValue] = useState(resolvedId != null ? String(resolvedId) : '');
  const [isLoading, setIsLoading] = useState(false);
  const [prevResolvedId, setPrevResolvedId] = useState(resolvedId);
  const requestIdRef = useRef(0);

  useEffect(
    () => () => {
      requestIdRef.current += 1;
    },
    [],
  );

  if (!isLoading && resolvedId !== prevResolvedId) {
    setPrevResolvedId(resolvedId);
    setInputValue(resolvedId != null ? String(resolvedId) : '');
  }

  const handleChange = useCallback(
    (newValue: string) => {
      setInputValue(newValue);
      onError?.(undefined);
    },
    [onError],
  );

  const handleSubmit = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      onError?.('empty-product-id');
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

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsLoading(true);
    onPendingChange?.(true);
    onError?.(undefined);

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
  }, [inputValue, onError, onPendingChange, onResolved, productType, universeId]);

  return { inputValue, handleChange, handleSubmit, isLoading };
}
