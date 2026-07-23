import React from 'react';
import { ErrorStates } from './types';

const VirtualBenefitContext = React.createContext<{
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
