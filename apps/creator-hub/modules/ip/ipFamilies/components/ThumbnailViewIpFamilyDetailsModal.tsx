import React, { useEffect } from 'react';
import { useTranslation } from '@rbx/intl';
import { AssetThumbnailSize, ReturnPolicy, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { Dialog, DialogContent, DialogActions, Button, makeStyles, DialogTitle } from '@rbx/ui';

const useStyles = makeStyles()(() => ({
  thumbnailContainer: {
    display: 'flex',
    paddingTop: 10,
    borderRadius: 4,
    maxWidth: 250,
  },
  thumbnailImg: {
    display: 'block',
    position: 'relative',
    objectFit: 'scale-down',
    borderRadius: 4,
  },
}));

interface Props {
  open: boolean;
  onClose: () => void;
  assetId: number;
}

/**
 * Modal to show an enlarged image from Ip Family Details page.
 */
const ThumbnailViewIpFamilyDetailsModal: React.FC<Props> = ({ open, onClose, assetId }) => {
  const { classes } = useStyles();
  const { translate } = useTranslation();
  useEffect(() => {
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} onClick={(event) => event.stopPropagation()}>
      <DialogTitle>{translate('Title.IpImageModal')}</DialogTitle>
      <DialogContent>
        <Thumbnail2d
          targetId={assetId}
          type={ThumbnailTypes.assetThumbnail}
          alt={translate('Label.IpContentThumbnail')}
          returnPolicy={ReturnPolicy.PlaceHolder}
          includeBackground={false}
          containerClass={classes.thumbnailContainer}
          imgClassName={classes.thumbnailImg}
          // eslint-disable-next-line no-underscore-dangle -- external enum
          size={AssetThumbnailSize._250x250}
        />
      </DialogContent>
      <DialogActions color='PrimaryBrand'>
        <Button variant='contained' onClick={onClose}>
          {translate('Action.Close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ThumbnailViewIpFamilyDetailsModal;
