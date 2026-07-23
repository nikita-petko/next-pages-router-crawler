import { useEffect, useState } from 'react';
import itemConfigurationClient from '@modules/clients/itemconfiguration';

/** Debounce window (ms) before fetching the restocking fee after a quantity change. */
const FEE_DEBOUNCE_MS = 500;

export interface RestockState {
  originalQuantity?: number;
  hasBeenRestocked: boolean;
  restockingFee?: number;
  restockEligible: boolean;
  restockIneligibilityReason?: string;
  maxRestockQuantityPerOp?: number;
}

export interface RestockStateActions {
  setOriginalQuantity: (qty: number | undefined) => void;
  setHasBeenRestocked: (val: boolean) => void;
  setRestockingFee: (fee: number | undefined) => void;
}

export interface RestockApiClient {
  getRestockEligibility: typeof itemConfigurationClient.getRestockEligibility;
  getRestockingFees: typeof itemConfigurationClient.getRestockingFees;
}

interface UseRestockStateParams {
  collectibleItemId?: string;
  quantity?: number;
  client?: RestockApiClient;
}

export function useRestockState({
  collectibleItemId,
  quantity,
  client = itemConfigurationClient,
}: UseRestockStateParams): [RestockState, RestockStateActions] {
  const [originalQuantity, setOriginalQuantity] = useState<number>();
  const [hasBeenRestocked, setHasBeenRestocked] = useState(false);
  const [restockingFee, setRestockingFee] = useState<number>();
  const [restockEligible, setRestockEligible] = useState(false);
  const [restockIneligibilityReason, setRestockIneligibilityReason] = useState<string>();
  const [maxRestockQuantityPerOp, setMaxRestockQuantityPerOp] = useState<number>();

  useEffect(() => {
    if (!collectibleItemId) {
      return undefined;
    }

    let cancelled = false;
    void (async () => {
      try {
        const eligibility = await client.getRestockEligibility(collectibleItemId);
        if (cancelled) {
          return;
        }
        setRestockEligible(eligibility.isEligible ?? false);
        setRestockIneligibilityReason(eligibility.ineligibilityReason);
        setMaxRestockQuantityPerOp(eligibility.maxRestockQuantityPerOperation);
        setHasBeenRestocked(eligibility.hasBeenRestocked ?? false);
      } catch {
        if (!cancelled) {
          setRestockEligible(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [collectibleItemId, client, setHasBeenRestocked]);

  // Debounced fee fetching when quantity changes. The timer is scoped to the effect so it is
  // cleared (and re-armed) on every dependency change without needing a ref.
  useEffect(() => {
    if (quantity && originalQuantity && quantity > originalQuantity && collectibleItemId) {
      const additionalQty = quantity - originalQuantity;
      const feeDebounceTimer = setTimeout(() => {
        void client
          .getRestockingFees(collectibleItemId, additionalQty)
          .then((response) => setRestockingFee(response.restockingFeeInRobux))
          .catch(() => setRestockingFee(undefined));
      }, FEE_DEBOUNCE_MS);

      return () => clearTimeout(feeDebounceTimer);
    }

    setRestockingFee(undefined); // oxlint-disable-line react/react-compiler -- clearing derived state on dep change
    return undefined;
  }, [quantity, originalQuantity, collectibleItemId, client]);

  const state = {
    originalQuantity,
    hasBeenRestocked,
    restockingFee,
    restockEligible,
    restockIneligibilityReason,
    maxRestockQuantityPerOp,
  } satisfies RestockState;

  const actions = {
    setOriginalQuantity,
    setHasBeenRestocked,
    setRestockingFee,
  } satisfies RestockStateActions;

  return [state, actions];
}
