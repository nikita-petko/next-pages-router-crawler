import { CloseIcon, makeStyles, OpenInFullIcon, Typography } from '@rbx/ui';

import { EventName, unifiedLogger } from '@clients/unifiedLogger';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';
import { useModalStore } from '@stores/modalStoreProvider';
import { GetLocalStorage, StorageKeys } from '@utils/localStorage';
import { TODOFIXANY } from 'app/shared/types';

interface UploadedSearchReviewComponentDynamicProps {
  overlayImageStr?: string;
  summaryView: boolean;
}

export const UploadedSearchReviewComponentDynamic = ({
  overlayImageStr,
  summaryView = false,
}: UploadedSearchReviewComponentDynamicProps) => {
  const imageSize = summaryView ? 125 : 210;

  const {
    classes: {
      adAssetReviewContainer,
      assetMetadataInfo,
      expandIconContainer,
      overlayModerationPreview,
      tilePreviewContainer,
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
      background: 'var(--color-over-media-0)',
      borderRadius: 4,
      // Set explicitly rather than inherited: the icon comes from MUI, whose
      // theme is independent of the `dark-theme` class scoping these tokens.
      color: 'var(--color-content-emphasis)',
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

    tilePreviewContainer: {
      position: 'relative',
      // @ts-ignore
      zIndex: '20',
    },
  }))();

  const { adAccountId = GetLocalStorage(StorageKeys.AD_ACCOUNT_ID) } = useAppStore(
    (state: AppStoreType) => state.appData,
  );

  const { setModalConfigData, setModalOpen } = useModalStore();

  const scaffolding_preview_svg_url = `${process.env.assetPathPrefix}/common/search_ad_preview_default.png`;

  const openFullScreenPreview = () => {
    unifiedLogger.logClickEvent({
      eventName: EventName.OpenImagePreview,
      parameters: { adAccountId },
    });

    const tile_image_overlay_styles = {
      borderRadius: '0.5vw',
      left: '38.2%',
      margin: '0.5%',
      position: 'absolute',
      top: '35%',
      width: '12vw',
      // @ts-ignore
      zIndex: '21',
    };

    setModalConfigData({
      completelyCustomModalContents: (
        // `dark-theme` pins this subtree to dark tokens: it renders a mockup of
        // the in-experience Roblox client, which is dark regardless of the
        // user's Ads Manager theme.
        <div
          className='dark-theme'
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
              style={{
                color: 'var(--color-system-warning)',
                left: '8px',
                position: 'absolute',
                top: '8px',
              }}
              variant='body1'>
              Actual position will be based on bid price.
            </Typography>
            <CloseIcon
              onClick={() => {
                setModalOpen(false);
              }}
              style={{
                color: 'var(--color-content-emphasis)',
                position: 'absolute',
                right: 0,
                top: '8px',
              }}
            />
          </div>
          <div
            style={{
              position: 'relative',
            }}>
            <img
              alt='preview of ad in experience'
              src={scaffolding_preview_svg_url}
              style={{
                borderRadius: 4,
                width: '70vw',
                // @ts-ignore
                zIndex: '21',
              }}
            />
            {/*
// @ts-ignore */}
            <img alt='uploaded file' src={overlayImageStr} style={tile_image_overlay_styles} />
            {/*
// @ts-ignore */}
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
      {/* Creative previews always sit on a dark backdrop, matching how the ad
          renders in-experience, so this tile is pinned to dark tokens. */}
      <div className={`dark-theme ${tilePreviewContainer}`}>
        {Boolean(overlayImageStr) && (
          <img
            alt=''
            role='img'
            src={overlayImageStr}
            style={{
              borderRadius: 4,
              height: imageSize,
              width: imageSize,
              // @ts-ignore
              zIndex: '21',
            }}
          />
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
        <div />
      </div>
    </div>
  );
};

export default UploadedSearchReviewComponentDynamic;
