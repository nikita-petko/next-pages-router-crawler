import { Button, CloseIcon, makeStyles, OpenInFullIcon, Tooltip, Typography } from '@rbx/ui';

import { EventName, unifiedLogger } from '@clients/unifiedLogger';
import { contentStaticDark } from '@constants/colors';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';
import { useModalStore } from '@stores/modalStoreProvider';
import { GetLocalStorage, StorageKeys } from '@utils/localStorage';
import { TODOFIXANY } from 'app/shared/types';

interface UploadedImageReviewComponentDynamicProps {
  adAssetStatus?: string;
  adFormat?: string;
  assetReplaced?: boolean;
  disableInputs?: boolean;
  livePreviewCb?: () => Promise<void>;
  overlayImageStr?: string;
  replaceImageCb?: TODOFIXANY;
  uploadedFormat?: string;
}

export const UploadedImageReviewComponentDynamic = ({
  adAssetStatus,
  adFormat,
  assetReplaced,
  disableInputs,
  livePreviewCb,
  overlayImageStr,
  replaceImageCb,
  uploadedFormat = 'image',
}: UploadedImageReviewComponentDynamicProps) => {
  const {
    classes: {
      adAssetReviewContainer,
      assetMetadataInfo,
      expandIconContainer,
      leftButton,
      livePreviewTooltip,
      overlayImagePreview,
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

    overlayImagePreview: {
      height: '100%',
      left: 0,
      position: 'absolute',
      top: 0,
      width: '100%',
      // @ts-ignore
      zIndex: '21',
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

  const { adAccountId = GetLocalStorage(StorageKeys.AD_ACCOUNT_ID) } = useAppStore(
    (state: AppStoreType) => state.appData,
  );

  const { setModalConfigData, setModalOpen } = useModalStore();

  const scaffolding_preview_jpg_url =
    adFormat === 'Awareness'
      ? `${process.env.assetPathPrefix}/common/display_ad_preview_default.jpg`
      : `${process.env.assetPathPrefix}/common/portal_ad_preview_default.jpg`;
  const openFullScreenPreview = () => {
    unifiedLogger.logClickEvent({
      eventName: EventName.OpenImagePreview,
      parameters: { adAccountId },
    });

    const undraggable: TODOFIXANY = {
      // @ts-ignore
      MozUserSelect: 'none',
      // @ts-ignore
      MsUserSelect: 'none',
      // @ts-ignore
      userDrag: 'none',
      // @ts-ignore
      userSelect: 'none',
      // @ts-ignore
      WebkitUserDrag: 'none',
      // @ts-ignore
      WebkitUserSelect: 'none',
    };

    const visits_ad_styles = {
      backgroundColor: contentStaticDark,
      borderRadius: 3.5,
      bottom: '52.2%',
      fontSize: '1.3vh',
      fontWeight: 325,
      height: '2vh',
      left: '62.2%',
      lineHeight: '2vh',
      margin: '0.5%',
      position: 'absolute',
      textAlign: 'center',
      width: '4.35vw',
      // @ts-ignore
      zIndex: '22',
    };
    const visits_image_overlay_styles = {
      height: '37%',
      position: 'absolute',
      right: '21.35vw',
      top: '10.8%',
      transform: 'perspective(63.5em) rotateX(-5deg)',
      width: '36.9%',
      // @ts-ignore
      zIndex: '21',
      // @ts-ignore
      ...undraggable,
    };
    const awareness_ad_styles = {
      backgroundColor: contentStaticDark,
      borderRadius: 3.5,
      bottom: '41%',
      fontSize: '1.3vh',
      fontWeight: 325,
      height: '2vh',
      left: '62.1%',
      lineHeight: '2vh',
      margin: '0.5%',
      position: 'absolute',
      textAlign: 'center',
      width: '4.35vw',
      // @ts-ignore
      zIndex: '22',
    };
    const awareness_image_overlay_styles = {
      height: '37.5%',
      left: '30%',
      margin: '0.5%',
      position: 'absolute',
      top: '20.99%',
      transform: 'scaleY(0.9645)',
      width: '27vw',
      // @ts-ignore
      zIndex: '21',
      // @ts-ignore
      ...undraggable,
    };
    const uploadedFileStyles =
      adFormat === 'Awareness' ? awareness_image_overlay_styles : visits_image_overlay_styles;

    const adOverlayStyles = adFormat === 'Awareness' ? awareness_ad_styles : visits_ad_styles;

    setModalConfigData({
      completelyCustomModalContents: (
        <div
          style={{
            left: '50%',
            position: 'fixed',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}>
          <div
            style={{
              backgroundColor: 'rgba(0,0,0,0.9)',
              height: '38px',
              position: 'absolute',
              top: '-38px',
              width: '100%',
            }}>
            <Typography
              style={{ color: '#F5BA19', left: '8px', position: 'absolute', top: '8px' }}
              variant='body1'>
              Publisher can customize ad container style to best fit their experience.
            </Typography>
            <CloseIcon
              onClick={() => {
                setModalOpen(false);
              }}
              style={{ color: 'white', position: 'absolute', right: 0, top: '8px' }}
            />
          </div>
          <div
            style={{
              position: 'relative',
            }}>
            <img
              alt='preview of ad in experience'
              draggable={false}
              src={scaffolding_preview_jpg_url}
              style={{
                borderRadius: 4,
                width: '70vw',
                // @ts-ignore
                zIndex: '21',
                // @ts-ignore
                ...undraggable,
              }}
            />
            {/*
// @ts-ignore */}
            <img
              alt='uploaded file'
              draggable={false}
              src={overlayImageStr}
              style={uploadedFileStyles}
            />
            {/*
// @ts-ignore */}
            <div style={adOverlayStyles}>Ad</div>
          </div>
        </div>
      ),
      handleClose: (_: TODOFIXANY) => {
        setModalOpen(false);
      },
    });
    setModalOpen(true);
  };
  return (
    <div className={adAssetReviewContainer}>
      <div className={thumbWithModerationStatus}>
        {Boolean(overlayImageStr) && (
          <img alt='uploaded file' className={overlayImagePreview} src={overlayImageStr} />
        )}
        <div
          className={overlayModerationPreview}
          onClick={openFullScreenPreview}
          onKeyPress={openFullScreenPreview}
          role='presentation'>
          <div className={expandIconContainer}>
            <OpenInFullIcon />
          </div>
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
                onClick={livePreviewCb}
                variant='outlined'>
                Live preview
              </Button>
            </Tooltip>
          )}
          {replaceImageCb && (
            <Button
              classes={{ root: leftButton }}
              color='primary'
              disabled={disableInputs}
              id='fileSelect'
              onClick={() => {
                replaceImageCb();
              }}
              variant='outlined'>
              Replace image
            </Button>
          )}
        </div>

        <div>
          <Typography color='secondary' variant='footer'>
            Format: {uploadedFormat}
          </Typography>
        </div>
        <div>
          <Typography color='secondary' variant='footer'>
            Aspect Ratio: Horizontal (16:9)
          </Typography>
        </div>
        <div>
          <Typography color='secondary' variant='footer'>
            Max dimensions: 1920 x 1080
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

export default UploadedImageReviewComponentDynamic;
