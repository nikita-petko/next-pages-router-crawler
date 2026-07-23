import { PropsWithChildren, createContext, useContext, useEffect, useMemo, useState } from 'react';

export interface PricingErrorState {
  hasError: boolean;
  setHasError: (hasError: boolean) => void;
}

const PricingErrorContext = createContext<PricingErrorState>({
  hasError: false,
  setHasError: () => {},
});

export const usePricingErrorContext = () => useContext(PricingErrorContext);

// Effect hook for errors loading data
export const usePricingError = (hasError: boolean) => {
  const { setHasError } = usePricingErrorContext();
  useEffect(() => {
    if (hasError) {
      setHasError(true);
    }
  }, [hasError, setHasError]);
};

export const PricingErrorProvider = ({ children }: PropsWithChildren) => {
  const [hasError, setHasError] = useState(false);
  const providerValue: PricingErrorState = useMemo(
    () => ({
      hasError,
      setHasError,
    }),
    [hasError],
  );
  return (
    <PricingErrorContext.Provider value={providerValue}>{children}</PricingErrorContext.Provider>
  );
};
