import React, {
  createContext,
  useContext,
  Dispatch,
  SetStateAction,
  useState,
  useMemo,
  useCallback,
} from 'react';
import { TCreator } from '@modules/clients';
import { TOwnershipTransferResource } from '../types';
import useGetFailingEligibilityChecks from '../hooks/useGetFailingEligibilityChecks';

export type TOwnershipTransferDialogInternalState = {
  acknowledgedTransferTerms: boolean;
  setAcknowledgedTransferTerms: Dispatch<SetStateAction<boolean>>;
  nameVerificationText: string;
  setNameVerificationText: Dispatch<SetStateAction<string>>;
  selectedRecipient: TCreator | undefined;
  setSelectedRecipient: Dispatch<SetStateAction<TCreator | undefined>>;

  resetState: () => void;

  isDisclaimerStepValid: boolean;
  isOwnerSelectionValid: boolean;
  isVerificationValid: boolean;
  isResourceEligible: boolean;
  wasResourceIneligible: boolean;
};

const OwnershipTransferDialogInternalStateContext =
  createContext<TOwnershipTransferDialogInternalState | null>(null);

type TOwnershipTransferDialogInternalStateProviderProps = {
  resource: TOwnershipTransferResource;
};

const OwnershipTransferDialogInternalStateProvider = ({
  resource,
  children,
}: React.PropsWithChildren<TOwnershipTransferDialogInternalStateProviderProps>) => {
  const [acknowledgedTransferTerms, setAcknowledgedTransferTerms] = useState<boolean>(false);
  const [nameVerificationText, setNameVerificationText] = useState<string>('');
  const [selectedRecipient, setSelectedRecipient] = useState<TCreator | undefined>();

  const { isIneligible, wasEverIneligible } = useGetFailingEligibilityChecks({ resource });

  const resetState = useCallback(() => {
    setAcknowledgedTransferTerms(false);
    setNameVerificationText('');
    setSelectedRecipient(undefined);
  }, [setAcknowledgedTransferTerms, setNameVerificationText, setSelectedRecipient]);

  const contextValue = useMemo(
    () =>
      ({
        acknowledgedTransferTerms,
        setAcknowledgedTransferTerms,
        nameVerificationText,
        setNameVerificationText,
        selectedRecipient,
        setSelectedRecipient,
        resetState,

        isDisclaimerStepValid: acknowledgedTransferTerms,
        isOwnerSelectionValid: !!selectedRecipient,
        // NOTE(@rvaughan, 10/09/2025): We trim the resource name because group names previously did not trim whitespace on creation, but now do.
        // This leads to a confusing UX for old groups where you have to remember to add trailing whitespace if it was there when creating a group.
        isVerificationValid: resource.resourceName.trim() === nameVerificationText,
        isResourceEligible: !isIneligible,
        wasResourceIneligible: wasEverIneligible,
      }) as TOwnershipTransferDialogInternalState,
    [
      acknowledgedTransferTerms,
      setAcknowledgedTransferTerms,
      nameVerificationText,
      setNameVerificationText,
      selectedRecipient,
      setSelectedRecipient,
      resetState,
      resource.resourceName,
      isIneligible,
      wasEverIneligible,
    ],
  );

  return (
    <OwnershipTransferDialogInternalStateContext.Provider value={contextValue}>
      {children}
    </OwnershipTransferDialogInternalStateContext.Provider>
  );
};

const useOwnershipTransferDialogInternalState = () => {
  const context = useContext(OwnershipTransferDialogInternalStateContext);
  if (!context) {
    throw new Error(
      'useOwnershipTransferDialogInternalState must be used within an OwnershipTransferDialogInternalStateProvider',
    );
  }
  return context;
};

export { useOwnershipTransferDialogInternalState, OwnershipTransferDialogInternalStateProvider };
