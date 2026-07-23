import { Button } from '@rbx/ui';
import { FormikProps } from 'formik';
import { useState } from 'react';

import { EventName, unifiedLogger } from '@clients/unifiedLogger';
import { CampaignObjectiveType } from '@constants/campaignBuilder';
import { previewAd, PreviewAdTypeEnum } from '@modules/clients/ads/adsClient';
import type { PreviewAdRequest } from '@modules/clients/ads/adsClient';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';
import { useModalStore } from '@stores/modalStoreProvider';
import { AdFormatType, ServerAdAssetCompositeReviewDecisionType } from '@type/ad';

/**
 * This interface represents the fields needed from the NewCampaignWizard formik
 * object to create a preview ad request.
 *
 * At some point along the line, the original type was lost on the formik object.
 * This interface acts only as a way to assert the type of the formik input, and
 * contains the minimum amount of fields needed.
 */
export interface AdCampaignCreationFormikProps {
  adAssetId: string;
  adPortalDestinationPlaceId: string;
  adType: AdFormatType;
  adVideoAssetId: string;
  campaignObjective: CampaignObjectiveType;
  compositeReviewDecision: ServerAdAssetCompositeReviewDecisionType;
}

const getPreviewAdTypeFromAdAndBidType = (
  adType: AdFormatType,
  campaignObjective: CampaignObjectiveType,
): PreviewAdTypeEnum => {
  let previewAdType: PreviewAdTypeEnum = PreviewAdTypeEnum.PREVIEW_AD_TYPE_UNSPECIFIED;
  switch (adType) {
    case AdFormatType.DISPLAY:
      previewAdType = PreviewAdTypeEnum.PREVIEW_AD_TYPE_IMAGE;
      break;
    case AdFormatType.PORTAL:
      previewAdType = PreviewAdTypeEnum.PREVIEW_AD_TYPE_PORTAL;
      break;
    case AdFormatType.VIDEO:
      if (campaignObjective === CampaignObjectiveType.AWARENESS) {
        previewAdType = PreviewAdTypeEnum.PREVIEW_AD_TYPE_VIDEO_CPM;
      } else if (campaignObjective === CampaignObjectiveType.VIDEO_VIEWS) {
        previewAdType = PreviewAdTypeEnum.PREVIEW_AD_TYPE_VIDEO_CPV_15;
      }
      break;
    default:
      break;
  }

  return previewAdType;
};

const convertFormikDataToPreviewAdRequest = (
  values: AdCampaignCreationFormikProps,
): Partial<PreviewAdRequest> => {
  const previewAdType = getPreviewAdTypeFromAdAndBidType(values.adType, values.campaignObjective);
  const previewAdRequest: PreviewAdRequest = {
    preview_ad: {
      preview_ad_type: previewAdType,
    },
  };
  switch (previewAdType) {
    case PreviewAdTypeEnum.PREVIEW_AD_TYPE_IMAGE:
      previewAdRequest.preview_ad.display_ad_metadata = {
        asset_metadata: {
          asset_id: values.adAssetId,
        },
      };
      break;
    case PreviewAdTypeEnum.PREVIEW_AD_TYPE_PORTAL:
      previewAdRequest.preview_ad.portal_ad_metadata = {
        banner_asset_metadata: {
          asset_id: values.adAssetId,
        },
        target_place_id: parseInt(values.adPortalDestinationPlaceId, 10) || 0,
      };
      break;
    case PreviewAdTypeEnum.PREVIEW_AD_TYPE_VIDEO_CPM:
    case PreviewAdTypeEnum.PREVIEW_AD_TYPE_VIDEO_CPV_15:
      previewAdRequest.preview_ad.video_ad_metadata = {
        asset_metadata: {
          asset_id: values.adVideoAssetId,
        },
      };
      break;
    default:
      break;
  }
  return previewAdRequest;
};

const LivePreviewDialogContent = ({ userName }: { userName: string }) => {
  return (
    <div>
      Use the Account <b>{userName}</b> to see and interact with your ad just like your audience
      will.
      <br />
      <br />
      This preview is for demo purposes only. Your ad will be shown in experiences based on the
      criteria set at the Ad Set step.
    </div>
  );
};

const LivePreviewDialogActions = ({
  formik,
  setModalOpen,
}: {
  formik: FormikProps<AdCampaignCreationFormikProps>;
  setModalOpen: (modalStatus: boolean) => void;
}) => {
  const [livePreviewLoading, setLivePreviewLoading] = useState<boolean>(false);
  const { setModalConfigDataToErrorModal } = useModalStore();
  const {
    livePreviewCpmPlaceUrl,
    livePreviewCpv15PlaceUrl,
    livePreviewImagePlaceUrl,
    livePreviewPortalPlaceUrl,
  } = useAppStore((state: AppStoreType) => state.appMetadataState.data);

  const getDestinationPlaceLinkFromAdType = (previewAdType: PreviewAdTypeEnum): string => {
    switch (previewAdType) {
      case PreviewAdTypeEnum.PREVIEW_AD_TYPE_IMAGE:
        return livePreviewPortalPlaceUrl;
      case PreviewAdTypeEnum.PREVIEW_AD_TYPE_PORTAL:
        return livePreviewImagePlaceUrl;
      case PreviewAdTypeEnum.PREVIEW_AD_TYPE_VIDEO_CPM:
        return livePreviewCpmPlaceUrl;
      case PreviewAdTypeEnum.PREVIEW_AD_TYPE_VIDEO_CPV_15:
        return livePreviewCpv15PlaceUrl;
      default:
        throw new Error('Invalid preview ad type');
    }
  };

  const handleLivePreview = async () => {
    try {
      setLivePreviewLoading(true);

      const previewAdRequest = convertFormikDataToPreviewAdRequest(formik.values);
      const previewAdType = previewAdRequest?.preview_ad?.preview_ad_type ?? 0;
      const previewAdResponse = await previewAd(previewAdRequest);

      if (previewAdResponse.status !== 200) {
        throw new Error('Failed to preview ad');
      }

      unifiedLogger.logClickEvent({
        eventName: EventName.LivePreview,
        parameters: { previewAdType: previewAdType.toString() },
      });

      window.open(getDestinationPlaceLinkFromAdType(previewAdType), '_blank');
    } catch (e: unknown) {
      setModalConfigDataToErrorModal();
      setModalOpen(true);
    } finally {
      setLivePreviewLoading(false);
    }
  };

  return (
    <>
      <Button
        color='primary'
        onClick={() => {
          setModalOpen(false);
        }}
        variant='outlined'>
        Close
      </Button>
      <Button loading={livePreviewLoading} onClick={handleLivePreview} variant='contained'>
        Go to Live Preview
      </Button>
    </>
  );
};

const ModerationRejectedDialogContent = () => {
  const { advertisingStandardsUrl, appealModerationDecisionUrl } = useAppStore(
    (state: AppStoreType) => state.appMetadataState.data,
  );

  return (
    <div>
      Your ad creative was rejected by moderation. Please review our{' '}
      <a href={advertisingStandardsUrl} rel='noopener noreferrer' target='_blank'>
        <u>advertising standards</u>
      </a>{' '}
      and submit a new ad with the appropriate adjustments. If you wish to appeal this decision,
      follow the{' '}
      <a href={appealModerationDecisionUrl} rel='noopener noreferrer' target='_blank'>
        <u>appeal instructions here</u>
      </a>
      .
    </div>
  );
};

const SingleOkButtonDialogActions = ({
  setModalOpen,
}: {
  setModalOpen: (modalStatus: boolean) => void;
}) => (
  <Button
    onClick={() => {
      setModalOpen(false);
    }}
    variant='contained'>
    Ok
  </Button>
);

const PlaceNotSelectedDialogContent = () => (
  <div>You can&apos;t preview your ad until you add a destination experience</div>
);

/**
 * Used in conjunction with the ModalContext and setModalConfigData method to open the live preview modal.
 * Metadata used by the modal should be provided by the caller
 *
 * @param setModalOpen: Function to set the modal open state
 * @param userName: The username of associated with the ad account
 * @param formik: FormikProps object for the form containing campaign, adset, and ad metadata
 * @returns The modal configuration object provided to the global modal context
 */
const getLivePreviewModalConfig = ({
  formik,
  setModalOpen,
  userName,
}: {
  formik: FormikProps<AdCampaignCreationFormikProps>;
  setModalOpen: (modalStatus: boolean) => void;
  userName: string;
}) => {
  let title = 'Live Preview';
  let dialogContent = <LivePreviewDialogContent userName={userName} />;
  let dialogActions = <LivePreviewDialogActions formik={formik} setModalOpen={setModalOpen} />;

  if (
    formik.values.adType === AdFormatType.PORTAL &&
    formik.values.adPortalDestinationPlaceId === ''
  ) {
    title = 'Select Destination Experience';
    dialogContent = <PlaceNotSelectedDialogContent />;
    dialogActions = <SingleOkButtonDialogActions setModalOpen={setModalOpen} />;
  } else if (
    formik.values.compositeReviewDecision === ServerAdAssetCompositeReviewDecisionType.REJECTED
  ) {
    title = 'Ad Creative Rejected';
    dialogContent = <ModerationRejectedDialogContent />;
    dialogActions = <SingleOkButtonDialogActions setModalOpen={setModalOpen} />;
  }

  return {
    dialogActions,
    dialogContent,
    handleClose: () => {
      setModalOpen(false);
    },
    title,
  };
};

export default getLivePreviewModalConfig;
