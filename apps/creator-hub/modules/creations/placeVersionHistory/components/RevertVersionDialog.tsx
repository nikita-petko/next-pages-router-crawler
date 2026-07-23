import React, { FunctionComponent, useCallback } from 'react';
import { useTranslation } from '@rbx/intl';
import { Dialog, DialogTemplate } from '@rbx/ui';
import usePlaceVersionHistory from '../hooks/usePlaceVersionHistory';

export interface RevertVersionDialogProps {
  assetVersionNumber: number | null;
  open: boolean;
  close: VoidFunction;
}

const RevertVersionDialog: FunctionComponent<React.PropsWithChildren<RevertVersionDialogProps>> = ({
  assetVersionNumber,
  open,
  close,
}) => {
  const { restoreCurrentVersionHistory, isRestoring } = usePlaceVersionHistory();
  const { translate } = useTranslation();

  const onConfirm = useCallback(async () => {
    if (assetVersionNumber) {
      await restoreCurrentVersionHistory(assetVersionNumber);
    }
    close();
  }, [close, restoreCurrentVersionHistory, assetVersionNumber]);

  return (
    <Dialog open={open}>
      <DialogTemplate
        cancelText={translate('Action.Cancel')}
        color='primaryBrand'
        confirmText={translate('Action.Restore')}
        content={translate('Description.RestoreVersion')}
        onCancel={close}
        onConfirm={onConfirm}
        loading={isRestoring}
        title={translate('Heading.RestoreVersion')}
        variant='alert'
      />
    </Dialog>
  );
};

export default RevertVersionDialog;
