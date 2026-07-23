import React from 'react';
import type { IPContent } from '@rbx/client-rights/v1';
import { IPContentContentTypeEnum } from '@rbx/client-rights/v1';
import { useTranslation } from '@rbx/intl';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
} from '@rbx/ui';
import { SupportedRobloxAssetTypeEnum } from '../constants';

interface Props {
  itemToArchive: IPContent;
  onClose: () => void;
  onArchive: () => void;
}

/**
 * Modal to archive an ip content.
 */
const ArchiveIpContentModal: React.FC<Props> = ({ itemToArchive, onClose, onArchive }) => {
  const { translate } = useTranslation();
  let dialogTitle;
  let dialogDescription;
  switch (itemToArchive.contentType) {
    case IPContentContentTypeEnum.Asset:
      if (itemToArchive.robloxAssetType === SupportedRobloxAssetTypeEnum.Image) {
        dialogTitle = translate('Label.ArchiveImage');
        dialogDescription = translate('Description.ArchiveImage');
      } else {
        dialogTitle = translate('Label.ArchiveAsset');
        dialogDescription = translate('Description.ArchiveAsset');
      }
      break;
    case IPContentContentTypeEnum.Image:
      dialogTitle = translate('Label.ArchiveImage');
      dialogDescription = translate('Description.ArchiveImage');
      break;
    case IPContentContentTypeEnum.Text:
    case undefined:
    default:
      dialogTitle = translate('Label.ArchiveKeyword');
      dialogDescription = translate('Description.ArchiveKeyword');
      break;
  }

  return (
    <Dialog
      open={!!itemToArchive}
      onClose={onClose}
      aria-labelledby='confirm-dialog-title'
      aria-describedby='confirm-dialog-description'>
      <DialogTitle id='confirm-dialog-title'>{dialogTitle}</DialogTitle>
      <DialogContent>
        <DialogContentText id='confirm-dialog-description'>{dialogDescription}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color='secondary' variant='contained'>
          {translate('Action.Cancel')}
        </Button>
        <Button onClick={onArchive} color='destructive' variant='contained'>
          {translate('Action.Archive')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ArchiveIpContentModal;
