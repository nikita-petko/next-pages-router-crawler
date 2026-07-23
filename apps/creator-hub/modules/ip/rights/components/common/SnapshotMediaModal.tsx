import React, { useEffect } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Dialog, DialogContent, DialogActions, Button, makeStyles, DialogTitle } from '@rbx/ui';
import { Asset } from '@modules/miscellaneous/common';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import SnapshotMediaPreview from '../reportCodes/SnapshotMediaPreview';

const useStyles = makeStyles()((theme) => ({
  dialogTitle: {
    marginBottom: theme.spacing(2),
    textAlign: 'center',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  dialogContent: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing(2),
  },
  mediaContainer: {
    maxWidth: 500,
    maxHeight: 500,
    width: '100%',
  },
}));

interface SnapshotMediaModalProps {
  open: boolean;
  onClose: () => void;
  contentUri?: string;
  assetType?: string;
  contentId?: string;
  contentName?: string;
}

const SnapshotMediaModal: React.FC<SnapshotMediaModalProps> = ({
  open,
  onClose,
  contentUri,
  assetType,
  contentId,
  contentName,
}) => {
  const { classes } = useStyles();
  const { translate } = useTranslation();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  if (!open) {
    return null;
  }

  const isVideo = assetType === Asset.Video;
  const title = contentName || (isVideo ? translate('Label.Video') : translate('Label.Image'));

  return (
    <Dialog open={open} onClose={onClose} onClick={(event) => event.stopPropagation()}>
      <DialogTitle className={classes.dialogTitle}>{title}</DialogTitle>
      <DialogContent className={classes.dialogContent}>
        <div className={classes.mediaContainer}>
          <SnapshotMediaPreview
            contentUri={contentUri}
            assetType={assetType}
            contentId={contentId}
            variant='full'
          />
        </div>
      </DialogContent>
      <DialogActions>
        <Button variant='contained' onClick={onClose}>
          {translate('Action.Close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default withTranslation(SnapshotMediaModal, [TranslationNamespace.RightsPortal]);
