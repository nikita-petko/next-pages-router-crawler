import type { FunctionComponent } from 'react';
import React, { useMemo } from 'react';
import type { IPContent, IPContentStatusReasonEnum } from '@rbx/client-rights/v1';
import { useTranslation, withTranslation } from '@rbx/intl';
import { AssetThumbnailSize, ReturnPolicy, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  makeStyles,
} from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { RobloxTermsOfUseLink } from '../../common/TermsOfUseLink';
import getIpContentStatusReason from '../common/getIpContentStatusReason';

interface IpContentRejectReasonModalProps {
  ipContent: IPContent | null;
  reason: IPContentStatusReasonEnum;
  dialogOpen: boolean;
  onDialogClose: () => void;
}

const useStyles = makeStyles()(() => ({
  dialogContent: {
    display: 'flex',
    gap: '24px',
    alignItems: 'flex-start',
  },
  imageContainer: {
    width: '100px',
    height: '100px',
    overflow: 'hidden',
  },
  thumbnailContainer: {
    display: 'block',
    borderRadius: '4px',
  },
  thumbnailImg: {
    objectFit: 'cover',
  },
}));

// dialog modal for viewing the reject reason of an IP content. Forked from RejectReasonModal.
const IpContentRejectReasonModal: FunctionComponent<IpContentRejectReasonModalProps> = ({
  ipContent,
  reason,
  dialogOpen,
  onDialogClose,
}) => {
  const { translate, translateHTML } = useTranslation();
  const { classes } = useStyles();

  const reasonText = useMemo(() => {
    if (!ipContent) {
      return '';
    }
    return getIpContentStatusReason(reason, ipContent, translate);
  }, [ipContent, reason, translate]);

  if (ipContent === null || !ipContent.contentType || !ipContent.contentValue) {
    return null;
  }

  return (
    <Dialog
      open={dialogOpen}
      onClose={onDialogClose}
      maxWidth='Medium'
      onClick={(event) => event.stopPropagation()}>
      <DialogTitle>{translate('Label.RejectionReason')}</DialogTitle>
      <DialogContent className={classes.dialogContent}>
        {ipContent.contentType === 'Image' && (
          <div className={classes.imageContainer}>
            <Thumbnail2d
              targetId={parseInt(ipContent.contentValue, 10)}
              type={ThumbnailTypes.assetThumbnail}
              alt={translate('Label.IpContentThumbnail')}
              returnPolicy={ReturnPolicy.PlaceHolder}
              includeBackground={false}
              containerClass={classes.thumbnailContainer}
              imgClassName={classes.thumbnailImg}
              // eslint-disable-next-line no-underscore-dangle -- external enum
              size={AssetThumbnailSize._110x110}
            />
          </div>
        )}
        <DialogContentText>
          {reasonText?.split(/\\+n/).map((item) => (
            <React.Fragment key={item}>
              {item}
              <br />
            </React.Fragment>
          ))}
          <br />
          <>
            {translateHTML('Description.LearnMore', [
              {
                opening: 'tosLinkStart',
                closing: 'tosLinkEnd',
                content(chunks) {
                  return <RobloxTermsOfUseLink>{chunks}</RobloxTermsOfUseLink>;
                },
              },
            ])}
          </>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button color='primaryBrand' variant='contained' onClick={onDialogClose}>
          {translate('Label.IUnderstand')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default withTranslation(IpContentRejectReasonModal, [TranslationNamespace.RightsPortal]);
