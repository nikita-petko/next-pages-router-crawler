import { useCallback, useState } from 'react';
import { hasResolvedSalesAvenue, type CollaborationSalesAvenues } from '../utils/salesAvenue';

export interface SalesAvenueStepState {
  isPending: boolean;
  isComplete: boolean;
  hasUnsubmittedInput: boolean;
}

interface UseSalesAvenueStepValidationOptions {
  enabled: boolean;
  salesAvenues: CollaborationSalesAvenues;
  onChange: (salesAvenues: CollaborationSalesAvenues) => void;
}

const EMPTY_STATE: SalesAvenueStepState = {
  isPending: false,
  isComplete: false,
  hasUnsubmittedInput: false,
};

export default function useSalesAvenueStepValidation({
  enabled,
  salesAvenues,
  onChange,
}: UseSalesAvenueStepValidationOptions) {
  const [state, setState] = useState(EMPTY_STATE);
  const [showRequiredErrors, setShowRequiredErrors] = useState(false);
  const [showUnsubmittedErrors, setShowUnsubmittedErrors] = useState(false);

  const handleChange = useCallback(
    (nextSalesAvenues: CollaborationSalesAvenues) => {
      setShowRequiredErrors(false);
      setShowUnsubmittedErrors(false);
      onChange(nextSalesAvenues);
    },
    [onChange],
  );

  const validate = useCallback(() => {
    if (!enabled) {
      return true;
    }
    if (state.isPending) {
      return false;
    }
    const hasResolvedSelection = hasResolvedSalesAvenue(salesAvenues);
    if (state.hasUnsubmittedInput) {
      setShowUnsubmittedErrors(true);
      setShowRequiredErrors(!hasResolvedSelection);
      const firstUnsubmittedInput = ['sales-avenue-developer-product', 'sales-avenue-game-pass']
        .map((id) => document.getElementById(id))
        .find(
          (element): element is HTMLInputElement =>
            element instanceof HTMLInputElement && element.value.trim().length > 0,
        );
      firstUnsubmittedInput?.focus();
      return false;
    }
    if (hasResolvedSelection) {
      return true;
    }
    setShowRequiredErrors(true);
    document.getElementById('sales-avenue-developer-product')?.focus();
    return false;
  }, [enabled, salesAvenues, state.hasUnsubmittedInput, state.isPending]);

  const resetUnsubmittedErrors = useCallback(() => {
    setShowUnsubmittedErrors(false);
  }, []);

  return {
    state,
    setState,
    showRequiredErrors,
    showUnsubmittedErrors,
    handleChange,
    validate,
    resetUnsubmittedErrors,
    isNextDisabled: enabled && state.isPending,
  };
}
