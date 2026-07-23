import React, { useState } from 'react';
import { TransferCreator } from '@modules/clients';
import OwnershipTransferDialog from './OwnershipTransferDialog';
import { TOwnershipTransferDialogVariant, TOwnershipTransferResource } from './types';
import { OwnershipTransferDialogInternalStateProvider } from './providers/OwnershipTransferDialogInternalStateProvider';

type TUseOwnershipTransferDialogOutput = {
  dialog: React.ReactElement;
  open: (variant: TOwnershipTransferDialogVariant) => void;
};

const useOwnershipTransferDialog = (
  resource: TOwnershipTransferResource,
  currentCreator: TransferCreator,
  targetCreator?: TransferCreator,
): TUseOwnershipTransferDialogOutput => {
  const [activeVariant, setActiveVariant] = useState<TOwnershipTransferDialogVariant | null>(null);

  const dialog = (
    <OwnershipTransferDialogInternalStateProvider resource={resource}>
      <OwnershipTransferDialog
        activeVariant={activeVariant}
        closeDialog={() => setActiveVariant(null)}
        resource={resource}
        currentCreator={currentCreator}
        targetCreator={targetCreator}
      />
    </OwnershipTransferDialogInternalStateProvider>
  );

  return {
    dialog,
    open: (variant) => setActiveVariant(variant),
  };
};

export default useOwnershipTransferDialog;
