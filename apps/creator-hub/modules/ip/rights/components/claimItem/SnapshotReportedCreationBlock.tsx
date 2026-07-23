import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  ClaimItem,
  ClaimItemView,
  ClaimItemViewViewStatusEnum,
  ContentMetadataCreatorTypeEnum,
} from '@rbx/clients/rightsV1';
import { useTranslation, withTranslation } from '@rbx/intl';
import { ReturnPolicy, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { CircularProgress, Grid, makeStyles, Typography, Link as UILink } from '@rbx/ui';
import { Icon } from '@rbx/foundation-ui';
import Link from 'next/link';
import React, { FunctionComponent } from 'react';
import { Asset } from '@modules/miscellaneous/common';
import { getGroupUrl, getUserUrl } from '@modules/miscellaneous/common/urls/www';
import useClaimItemMetadata from '../../hooks/useClaimItemMetadata';
import useClaimItemView from '../../hooks/useClaimItemView';
import useClaimItemDetailStyles from './useClaimItemDetailStyles';
import SnapshotMediaPreview from '../reportCodes/SnapshotMediaPreview';

const useStyles = makeStyles()((theme) => ({
  mediaContainer: {
    borderRadius: '8px',
    width: '100%',
    overflow: 'hidden',
  },
  mediaBorder: {
    border: '2px solid white',
  },
  placeholderContainer: {
    borderRadius: '8px',
    width: '100%',
    aspectRatio: '1 / 1',
    backgroundColor: theme.palette.surface?.[400] ?? 'rgba(255, 255, 255, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
}));

interface SnapshotReportedCreationBlockProps {
  claimItem: ClaimItem;
  isAllegedInfringer: boolean;
}

const SnapshotReportedCreationBlock: FunctionComponent<SnapshotReportedCreationBlockProps> = ({
  claimItem,
  isAllegedInfringer,
}) => {
  const { translate } = useTranslation();
  const {
    classes: { creationBlock, contentBlock, contentLink, container, border, image },
  } = useClaimItemDetailStyles();
  const {
    classes: { mediaContainer, mediaBorder, placeholderContainer },
  } = useStyles();

  const accountId = claimItem?.accountId ?? '';
  const claimItemId = claimItem?.id ?? '';

  const {
    metadata,
    isPending: isMetadataPending,
    isSuccess: isMetadataSuccess,
    error: metadataError,
  } = useClaimItemMetadata(accountId, claimItemId);
  const content = metadata?.[0];
  const isPlaceAsset = content?.assetType === Asset.Place;
  const isViewEnabled = isMetadataSuccess && !isPlaceAsset;
  const { claimItemView, isPending: isViewPending } = useClaimItemView(
    accountId,
    claimItemId,
    isViewEnabled,
  );
  const contentView = claimItemView?.contentViews?.find(
    (view: ClaimItemView) => view.contentId === content?.contentId,
  );

  const contentName = content?.contentName ?? '';
  const creatorName = content?.creatorName ?? '';
  const creatorId = content?.creatorId ?? '';
  const creatorType = content?.creatorType;
  let creatorURL = '';
  if (creatorType === ContentMetadataCreatorTypeEnum.Group) {
    creatorURL = getGroupUrl(Number(creatorId));
  } else {
    creatorURL = getUserUrl(Number(creatorId));
  }

  const isPending = isMetadataPending || (isViewEnabled && isViewPending);
  const thumbnailReady = contentView?.viewStatus === ClaimItemViewViewStatusEnum.Ready;

  const renderContentPreview = () => {
    if (isPlaceAsset) {
      return (
        <Thumbnail2d
          imgClassName={image}
          targetId={parseInt(content?.contentId ?? '-1', 10)}
          skeletonVariant='rectangular'
          type={ThumbnailTypes.assetThumbnail}
          alt={translate('Label.ContentPreview')}
          containerClass={isAllegedInfringer ? `${container} ${border}` : container}
          returnPolicy={ReturnPolicy.PlaceHolder}
          includeBackground
        />
      );
    }

    if (thumbnailReady && contentView?.contentUri) {
      return (
        <div className={isAllegedInfringer ? `${mediaContainer} ${mediaBorder}` : mediaContainer}>
          <SnapshotMediaPreview
            contentUri={contentView.contentUri}
            assetType={content?.assetType}
            contentId={content?.contentId}
            variant='full'
            fallback={
              <Icon
                name='icon-regular-lock-closed'
                style={{ width: '28.5714%', height: '28.5714%' }}
              />
            }
          />
        </div>
      );
    }

    return (
      <div
        className={
          isAllegedInfringer ? `${placeholderContainer} ${mediaBorder}` : placeholderContainer
        }>
        <Icon name='icon-regular-lock-closed' style={{ width: '28.5714%', height: '28.5714%' }} />
      </div>
    );
  };

  if (isPending) {
    return (
      <Grid XSmall rowSpacing={2} container item className={creationBlock}>
        <Grid item XSmall={12}>
          <Typography variant='body2' color='secondary'>
            {isAllegedInfringer
              ? translate('Label.MyCreation')
              : translate('Label.ReportedCreation')}
          </Typography>
        </Grid>
        <Grid item XSmall={12} container>
          <div
            className={
              isAllegedInfringer ? `${placeholderContainer} ${mediaBorder}` : placeholderContainer
            }>
            <CircularProgress />
          </div>
        </Grid>
      </Grid>
    );
  }

  return (
    <Grid XSmall rowSpacing={2} container item className={creationBlock}>
      <Grid item XSmall={12}>
        <Typography variant='body2' color='secondary'>
          {isAllegedInfringer ? translate('Label.MyCreation') : translate('Label.ReportedCreation')}
        </Typography>
      </Grid>
      <Grid item XSmall={12} container>
        {/* Place assets don't support snapshot views, so fall back to the default thumbnail */}
        {renderContentPreview()}
      </Grid>
      {!metadataError && (
        <Grid container item rowSpacing={1} XSmall={12} className={contentBlock}>
          <Grid item XSmall={12} className={contentLink}>
            <Typography color='inherit'>{contentName}</Typography>
          </Grid>
          {creatorName && (
            <Grid item XSmall={12}>
              <Link href={creatorURL} passHref legacyBehavior>
                <UILink color='inherit' target='_blank'>
                  @{creatorName}
                </UILink>
              </Link>
            </Grid>
          )}
        </Grid>
      )}
      {!!metadataError && (
        <Grid item XSmall={12}>
          <Typography variant='body2' color='primary'>
            {translate('Label.ID')}: {content?.contentId}
          </Typography>
        </Grid>
      )}
    </Grid>
  );
};

export default withTranslation(SnapshotReportedCreationBlock, [TranslationNamespace.RightsPortal]);
