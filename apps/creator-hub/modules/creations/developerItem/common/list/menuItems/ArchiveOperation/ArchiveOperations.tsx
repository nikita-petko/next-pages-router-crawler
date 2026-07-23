import React, { ForwardRefRenderFunction, forwardRef, useCallback, useState } from 'react';
import { developClient, tryParseResponseError } from '@modules/clients';
import { MenuItem, Typography } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import useBottomMessage from '../useBottomMessage';

export type TArchiveOperationsProps = {
  assetId: number;
  isArchived: boolean;
  onRemove: () => void;
};

const ArchiveOperations: ForwardRefRenderFunction<HTMLLIElement, TArchiveOperationsProps> = (
  { assetId, onRemove, isArchived },
  ref,
) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { translate } = useTranslation();
  const { showBottomMsg } = useBottomMessage();
  const handleArchive = useCallback(async () => {
    setIsLoading(true);
    try {
      await developClient.archiveAsset(assetId);
      onRemove();
      showBottomMsg(translate('Message.ArchiveSuccess'));
    } catch (e) {
      const error = await tryParseResponseError(e);
      if (error?.code === 21) {
        showBottomMsg(translate('Response.ArchivingPreventedForWearableAsset'));
      } else {
        showBottomMsg(translate('Response.UnknownError'));
      }
    } finally {
      setIsLoading(false);
    }
  }, [assetId, onRemove, showBottomMsg, translate]);
  const handleRestore = useCallback(async () => {
    setIsLoading(true);
    try {
      await developClient.restoreAsset(assetId);
      onRemove();
      showBottomMsg(translate('Message.RestoreSuccess'));
    } catch (e) {
      showBottomMsg(translate('Response.UnknownError'));
    } finally {
      setIsLoading(false);
    }
  }, [assetId, onRemove, showBottomMsg, translate]);
  return (
    <MenuItem
      key='action.Archive'
      data-testid='archive-operation-menu-item'
      onClick={isArchived ? handleRestore : handleArchive}
      disabled={isLoading}
      ref={ref}>
      {isArchived ? (
        <Typography color='success'>{translate('Action.Restore')}</Typography>
      ) : (
        <Typography color='error'>{translate('Action.Archive')}</Typography>
      )}
    </MenuItem>
  );
};

export default forwardRef(ArchiveOperations);
