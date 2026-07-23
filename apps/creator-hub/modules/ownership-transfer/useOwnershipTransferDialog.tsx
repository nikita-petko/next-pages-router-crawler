import React, { useState } from 'react';
import type { TransferCreator } from '@modules/clients/ownershipTransferApi';
import OwnershipTransferDialog from './OwnershipTransferDialog';
import { OwnershipTransferDialogInternalStateProvider } from './providers/OwnershipTransferDialogInternalStateProvider';
import type { TOwnershipTransferDialogVariant, TOwnershipTransferResource } from './types';

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
