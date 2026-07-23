import { createContext } from 'react';
import type { ErrorStates } from './types';

const VirtualBenefitContext = createContext<{
  errorState: ErrorStates | null;
  setErrorState: (state: ErrorStates | null) => void;
  isLoadingAsset: boolean;
  setIsLoadingAsset: (state: boolean) => void;
}>({
  errorState: null,
  setErrorState: () => {},
  isLoadingAsset: false,
  setIsLoadingAsset: () => {},
});

export default VirtualBenefitContext;
