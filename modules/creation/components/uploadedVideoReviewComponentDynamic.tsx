// @ts-nocheck
import { Button, makeStyles, OpenInFullIcon, Tooltip, Typography } from '@rbx/ui';
import { ReactElement } from 'react';

import { EventName, unifiedLogger } from '@clients/unifiedLogger';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';
import { useModalStore } from '@stores/modalStoreProvider';
import { GetLocalStorage, StorageKeys } from '@utils/localStorage';
import { TODOFIXANY } from 'app/shared/types';

import VideoPreview from './videoPreviewComponent';

interface UploadedVideoReviewComponentDynamicProps {
  adAssetStatus?: string;
  adFormat?: string;
  assetReplaced?: boolean;
  disableInputs?: boolean;
  duration?: number;
  fullCPVScreenVideoPreview?: boolean;
  livePreviewCb?: () => Promise<void>;
  overrideThumbVideoPlayer?: ReactElement<any>;
  replaceVideoCb?: TODOFIXANY;
  uploadedFormat?: string;
  uploadedVideoObjectUrl?: string;
}

export const UploadedVideoReviewComponentDynamic = ({
  adAssetStatus,
  adFormat,
  assetReplaced,
  disableInputs,
  duration,
  fullCPVScreenVideoPreview = false,
  livePreviewCb,
  overrideThumbVideoPlayer,
  replaceVideoCb,
  uploadedFormat,
  uploadedVideoObjectUrl,
}: UploadedVideoReviewComponentDynamicProps) => {
  const {
    classes: {
      adAssetReviewContainer,
      assetMetadataInfo,
      expandIconContainer,
      leftButton,
      livePreviewTooltip,
      overlayModerationPreview,
      thumbWithModerationStatus,
    },
  } = makeStyles()(() => ({
    adAssetReviewContainer: {
      display: 'flex',
      flexDirection: 'row',
    },

    assetMetadataInfo: {
      paddingLeft: 10,
    },

    expandIconContainer: {
      alignItems: 'center',
      background: 'rgba(17, 18, 20, 0.8)',
      borderRadius: 4,
      display: 'flex',
      height: 30,
      justifyContent: 'center',
      margin: 2,
      padding: 2,
      position: 'absolute',
      right: 0,
      top: 0,
      width: 30,
    },

    leftButton: {
      marginRight: 8,
    },

    livePreviewTooltip: {
      backgroundColor: 'white',
      color: 'rgba(0, 0, 0, 0.87)',
      fontSize: 14,
    },

    overlayModerationPreview: {
      alignItems: 'center',
      display: 'flex',
      flexFlow: 'column',
      height: '100%',
      justifyContent: 'center',
      left: 0,
      position: 'absolute',
      top: 0,
      width: '100%',
      // @ts-ignore
      zIndex: '22',
    },

    thumbWithModerationStatus: {
      backgroundColor: 'rgba(255, 255, 255, 0.09)',
      borderRadius: '8px',
      height: 120,
      position: 'relative',
      width: 213,
      // @ts-ignore
      zIndex: '20',
    },
  }))();

  const showDegradedExperience =
    uploadedFormat === 'image/png' || Boolean(overrideThumbVideoPlayer);

  const { adAccountId = GetLocalStorage(StorageKeys.AD_ACCOUNT_ID) } = useAppStore(
    (state: AppStoreType) => state.appData,
  );

  const { setModalConfigData, setModalOpen } = useModalStore();

  const openFullScreenPreview = () => {
    unifiedLogger.logClickEvent({
      eventName: EventName.OpenVideoPreview,
      parameters: { adAccountId },
    });

    if (showDegradedExperience) {
      return;
    }

    setModalConfigData({
      completelyCustomModalContents: (
        <VideoPreview
          closeModal={() => setModalOpen(false)}
          isCpv15={fullCPVScreenVideoPreview === true}
          uploadedFormat={uploadedFormat}
          uploadedVideoObjectUrl={uploadedVideoObjectUrl}
        />
      ),
      handleClose: (_: TODOFIXANY) => {
        setModalOpen(false);
      },
    });
    setModalOpen(true);
  };

  const disableLivePreview = adFormat === 'Video Views';

  return (
    <div className={adAssetReviewContainer}>
      <div className={thumbWithModerationStatus}>
        {Boolean(uploadedVideoObjectUrl) && !showDegradedExperience && (
          <video style={{ height: '100%', width: '100%' }}>
            <source src={uploadedVideoObjectUrl} type={uploadedFormat} />
          </video>
        )}
        {Boolean(uploadedVideoObjectUrl) && showDegradedExperience && (
          <>
            {Boolean(overrideThumbVideoPlayer) && overrideThumbVideoPlayer}
            {!overrideThumbVideoPlayer && (
              <img
                alt='Thumbnail for a uploaded video'
                src={uploadedVideoObjectUrl}
                style={{ height: '100%', width: '100%' }}
              />
            )}
          </>
        )}
        <div
          className={overlayModerationPreview}
          onClick={openFullScreenPreview}
          onKeyPress={openFullScreenPreview}
          role='presentation'>
          {!showDegradedExperience && (
            <div className={expandIconContainer}>
              <OpenInFullIcon />
            </div>
          )}
        </div>
      </div>
      <div className={assetMetadataInfo}>
        <div>
          {livePreviewCb && (
            <Tooltip
              arrow
              classes={{ tooltip: livePreviewTooltip }}
              open={assetReplaced}
              placement='top'
              title='Relaunch the demo experience to view updated asset'>
              <Button
                classes={{ root: leftButton }}
                color='primary'
                disabled={disableLivePreview}
                onClick={livePreviewCb}
                variant='outlined'>
                Live preview
              </Button>
            </Tooltip>
          )}
          {replaceVideoCb && (
            <Button
              classes={{ root: leftButton }}
              color='primary'
              disabled={disableInputs}
              id='fileSelect'
              onClick={() => {
                replaceVideoCb();
              }}
              variant='outlined'>
              Replace video
            </Button>
          )}
        </div>
        {uploadedFormat && (
          <div>
            <Typography color='secondary' variant='footer'>
              Format: {showDegradedExperience ? 'Video' : uploadedFormat}
            </Typography>
          </div>
        )}
        {Boolean(duration) && (
          <div>
            <Typography color='secondary' variant='footer'>
              Duration: {duration} seconds
            </Typography>
          </div>
        )}
        <div>
          <Typography color='secondary' variant='footer'>
            Aspect Ratio: Horizontal (16:9)
          </Typography>
        </div>
        <div>
          <Typography color='secondary' variant='footer'>
            Asset Status: {adAssetStatus || 'Pending Review'}
          </Typography>
        </div>
      </div>
    </div>
  );
};

export default UploadedVideoReviewComponentDynamic;
