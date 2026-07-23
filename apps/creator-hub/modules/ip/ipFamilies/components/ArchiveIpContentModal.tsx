import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
} from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { IPContent, IPContentContentTypeEnum } from '@rbx/clients/rightsV1';

interface Props {
  itemToArchive: IPContent;
  onClose: () => void;
  onArchive: () => void;
}

/**
 * Modal to archive an ip content that is a secondary keyword or image.
 */
const ArchiveIpContentModal: React.FC<Props> = ({ itemToArchive, onClose, onArchive }) => {
  const { translate } = useTranslation();
  const isImage = itemToArchive.contentType === IPContentContentTypeEnum.Image;

  const dialogTitle = isImage ? translate('Label.ArchiveImage') : translate('Label.ArchiveKeyword');
  const dialogDescription = isImage
    ? translate('Description.ArchiveImage')
    : translate('Description.ArchiveKeyword');

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
        <Button onClick={onArchive} color='destructive' variant='contained' autoFocus>
          {translate('Action.Archive')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ArchiveIpContentModal;
