import React, { FunctionComponent, useState } from 'react';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  ClaimItem,
  ClaimItemStatusEnum,
  ClaimItemView,
  ClaimItemViewViewStatusEnum,
  ContentMetadataCreatorTypeEnum,
} from '@rbx/clients/rightsV1';
import { useTranslation, withTranslation } from '@rbx/intl';
import { ReturnPolicy, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import {
  BrokenImageOutlinedIcon,
  CircularProgress,
  Grid,
  makeStyles,
  Typography,
  Link as UILink,
} from '@rbx/ui';
import { Icon } from '@rbx/foundation-ui';
import Link from 'next/link';
import { Asset } from '@modules/miscellaneous/common';
import { getGroupUrl, getUserUrl } from '@modules/miscellaneous/common/urls/www';
import useClaimItemMetadata from '../../hooks/useClaimItemMetadata';
import useClaimItemView from '../../hooks/useClaimItemView';
import SnapshotMediaPreview from '../reportCodes/SnapshotMediaPreview';
import SnapshotMediaModal from './SnapshotMediaModal';

const useStyles = makeStyles()((theme) => ({
  contentBlock: {
    overflow: 'hidden',
    justifyContent: 'center',
  },
  contentLink: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  clickableThumbnail: {
    cursor: 'pointer',
    '&:hover': {
      opacity: 0.8,
    },
  },
  fallbackContainer: {
    width: 40,
    height: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    backgroundColor: theme.palette.surface?.[400] ?? 'rgba(255, 255, 255, 0.12)',
  },
}));

interface SnapshotContentGridProps {
  claim: ClaimItem;
}

const nonTerminalStatuses: ClaimItemStatusEnum[] = [
  ClaimItemStatusEnum.Open,
  ClaimItemStatusEnum.Pending,
  ClaimItemStatusEnum.Dispute,
  ClaimItemStatusEnum.Escalate,
  ClaimItemStatusEnum.Creating,
];

const SnapshotContentGrid: FunctionComponent<SnapshotContentGridProps> = ({ claim }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isNonTerminalStatus = nonTerminalStatuses.includes(claim.status as ClaimItemStatusEnum);
  const {
    metadata,
    isPending: isMetadataPending,
    isSuccess: isMetadataSuccess,
    error: metadataError,
  } = useClaimItemMetadata(claim.accountId as string, claim.id as string);
  const content = metadata?.[0];
  const isPlaceAsset = content?.assetType === Asset.Place;
  const isViewEnabled = isNonTerminalStatus && isMetadataSuccess && !isPlaceAsset;
  const { claimItemView, isPending: isViewPending } = useClaimItemView(
    claim.accountId as string,
    claim.id as string,
    isViewEnabled,
  );
  const contentView = claimItemView?.contentViews?.find(
    (view: ClaimItemView) => view.contentId === content?.contentId,
  );
  const { ready, translate } = useTranslation();
  const {
    classes: { contentBlock, contentLink, clickableThumbnail, fallbackContainer },
  } = useStyles();

  let creatorURL = '';
  if (content?.creatorType === ContentMetadataCreatorTypeEnum.Group) {
    creatorURL = getGroupUrl(Number(content?.creatorId));
  } else {
    creatorURL = getUserUrl(Number(content?.creatorId));
  }

  const isPending = isMetadataPending || (isViewEnabled && isViewPending);
  const thumbnailReady =
    isNonTerminalStatus && contentView?.viewStatus === ClaimItemViewViewStatusEnum.Ready;
  const isVideo = content?.assetType?.toLowerCase() === Asset.Video.toLowerCase();
  const isClickable = thumbnailReady && !!contentView?.contentUri && isVideo;

  const handleThumbnailClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (isClickable) {
      setIsModalOpen(true);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  if (isPending || !ready) {
    return <CircularProgress />;
  }

  const viewStatusUndefined = contentView?.viewStatus === undefined;
  const viewStatusError = contentView?.viewStatus === ClaimItemViewViewStatusEnum.Error;
  const viewStatusPending = contentView?.viewStatus === ClaimItemViewViewStatusEnum.Pending;

  const getFallbackElement = () => {
    // Show a locked image if in terminal status (view API not called)
    if (!isNonTerminalStatus) {
      return (
        <div className={fallbackContainer}>
          <Icon name='icon-regular-lock-closed' />
        </div>
      );
    }
    if (viewStatusUndefined || viewStatusError) {
      return (
        <div className={fallbackContainer}>
          <BrokenImageOutlinedIcon />
        </div>
      );
    }
    if (viewStatusPending) {
      return (
        <div className={fallbackContainer}>
          <CircularProgress size={24} />
        </div>
      );
    }
    return (
      <div className={fallbackContainer}>
        <BrokenImageOutlinedIcon />
      </div>
    );
  };

  const thumbnail = isPlaceAsset ? (
    <Grid item>
      <div className={fallbackContainer}>
        <Thumbnail2d
          targetId={parseInt(content?.contentId ?? '-1', 10)}
          type={ThumbnailTypes.assetThumbnail}
          alt={translate('Label.ContentPreview')}
          returnPolicy={ReturnPolicy.PlaceHolder}
          includeBackground={false}
        />
      </div>
    </Grid>
  ) : (
    <Grid
      item
      onClick={handleThumbnailClick}
      className={isClickable ? clickableThumbnail : undefined}>
      {thumbnailReady && contentView?.contentUri ? (
        <SnapshotMediaPreview
          contentUri={contentView.contentUri}
          assetType={content?.assetType}
          contentId={content?.contentId}
          variant='mini'
          style={{ borderRadius: 0 }}
          fallback={getFallbackElement()}
        />
      ) : (
        getFallbackElement()
      )}
    </Grid>
  );

  return (
    <React.Fragment>
      <Grid container spacing={2} flexWrap='nowrap'>
        {thumbnail}
        {!!metadataError && (
          <Grid item container direction='column' XSmall zeroMinWidth flexWrap='nowrap'>
            <Typography noWrap variant='body2'>
              {translate('Label.ID')}: {content?.contentId}
            </Typography>
            <Typography noWrap variant='body2' color='error'>
              {translate('Label.CouldNotFetchCreation')}
            </Typography>
          </Grid>
        )}
        {!metadataError && (
          <Grid item container direction='column' XSmall className={contentBlock}>
            <Grid item className={contentLink}>
              {content?.contentName ? (
                <Typography noWrap variant='body2'>
                  {content.contentName}
                </Typography>
              ) : (
                <Typography noWrap variant='body2'>
                  {translate('Label.OffPlatformCreation')}
                </Typography>
              )}
            </Grid>
            <Grid item className={contentLink}>
              {content?.creatorName && (
                <Link href={creatorURL} passHref legacyBehavior>
                  <UILink
                    variant='body2'
                    color='inherit'
                    target='_blank'
                    onClick={(event) => event.stopPropagation()}>
                    @{content.creatorName}
                  </UILink>
                </Link>
              )}
            </Grid>
          </Grid>
        )}
      </Grid>
      <SnapshotMediaModal
        open={isModalOpen}
        onClose={handleModalClose}
        contentUri={contentView?.contentUri}
        assetType={content?.assetType}
        contentId={content?.contentId}
        contentName={content?.contentName}
      />
    </React.Fragment>
  );
};

export default withTranslation(SnapshotContentGrid, [TranslationNamespace.RightsPortal]);
