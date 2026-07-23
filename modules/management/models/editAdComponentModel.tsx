import * as Yup from 'yup';

import { CampaignObjectiveType } from '@constants/campaignBuilder';
import {
  AgeCriteria,
  DeviceCriteria,
  GenderCriteria,
  LanguageCriteria,
  ServerAdFormatType,
} from '@modules/clients/ads/adsClientTypes';
import { adNameValidation } from '@modules/creation/wizard/models/createCampaignWizard/createCampaignWizardModel';
import { AdFormatType, ServerAdAssetCompositeReviewDecisionType } from '@type/ad';
import { AdSetAuctionType, AdSetBidType } from '@type/adSet';
import { TODOFIXANY } from 'app/shared/types';

export const editAdComponentModel = {
  formField: {
    adAssetHeight: {
      label: 'Ad Asset Height',
      name: 'adAssetHeight',
      requiredErrorMsg: 'Ad asset height is required',
    },
    adAssetId: {
      label: 'Ad Asset Id',
      name: 'adAssetId',
      requiredErrorMsg: 'Ad asset id is required',
    },
    adAssetWidth: {
      label: 'Ad Asset Width',
      name: 'adAssetWidth',
      requiredErrorMsg: 'Ad asset width is required',
    },
    adDestinationUniverseId: {
      label: 'Destination Experience',
      name: 'adDestinationUniverseId',
      requiredErrorMsg: 'Ad destination experience is required',
    },
    // Editable fields: name
    adName: {
      label: 'Ad Name',
      name: 'adName',
      requiredErrorMsg: 'Ad name is required',
    },
    adPortalDestinationPlaceId: {
      label: 'Portal Destination Experience',
      name: 'adPortalDestinationPlaceId',
      requiredErrorMsg: 'Ad Portal destination is required',
    },
    adPortalDestinationText: {
      label: 'Portal Text',
      name: 'adPortalDestinationText',
      requiredErrorMsg: 'Ad Portal text is required',
    },
    adType: {
      label: 'Ad Format',
      name: 'adType',
      requiredErrorMsg: 'Ad Format is required',
    },
    // This field is decoupled from adAssetId to hold the id of video ads.
    // adAssetId is used exclusively for image ads.
    adVideoAssetId: {
      label: 'Ad Video Asset Id',
      name: 'adVideoAssetId',
      requiredErrorMsg: 'Ad video asset id is required',
    },
    campaignObjective: {
      label: 'Campaign Objective',
      name: 'campaignObjective',
      requiredErrorMsg: 'Campaign objective is required',
    },
    compositeReviewDecision: {
      label: 'Composite Review Decision',
      name: 'compositeReviewDecision',
      requiredErrorMsg: 'Composite Review Decision is required',
    },
  },
  formId: 'editAdComponent',
};

const {
  formField: {
    adAssetHeight,
    adAssetId,
    adAssetWidth,
    adDestinationUniverseId,
    adName,
    adPortalDestinationPlaceId,
    adPortalDestinationText,
    adType,
    adVideoAssetId,
    campaignObjective,
    compositeReviewDecision,
  },
} = editAdComponentModel;

interface EditAdComponentInitialValuesType {
  adSetAgeTargeting: AgeCriteria;
  adSetAuctionType: AdSetAuctionType;
  adSetBidType: AdSetBidType;
  adSetBidValueUsd: number;
  adSetDeviceTargeting: DeviceCriteria;
  adSetFrequencyCapOn: boolean;
  adSetFrequencyCapValue: number;
  adSetGenderTargeting: GenderCriteria;
  adSetId: string;
  adSetLanguageTargeting: LanguageCriteria;
  adSetName: string;
  campaignObjective: CampaignObjectiveType;
  compositeReviewDecision: ServerAdAssetCompositeReviewDecisionType;
}

export function getEditAdInitialValues(row: TODOFIXANY): Partial<EditAdComponentInitialValuesType> {
  if (ServerAdFormatType[row.type] === AdFormatType.PORTAL) {
    return {
      [adAssetHeight.name]: row.portal_ad_metadata?.banner_asset_metadata.height,
      [adAssetId.name]: row.portal_ad_metadata?.banner_asset_metadata.asset_id,
      [adAssetWidth.name]: row.portal_ad_metadata?.banner_asset_metadata.width,
      [adName.name]: row.name,
      [adPortalDestinationPlaceId.name]: row.portal_ad_metadata?.target_place_id,
      [adPortalDestinationText.name]: row.portal_ad_metadata?.text,
      [adType.name]: ServerAdFormatType[row.type],
      [campaignObjective.name]: CampaignObjectiveType.VISITS,
      [compositeReviewDecision.name]: row.composite_review_decision,
    };
  }

  if (ServerAdFormatType[row.type] === AdFormatType.TILE) {
    return {
      [adDestinationUniverseId.name]: row.sponsored_universe_ad_metadata?.target_universe_id,
      [adName.name]: row.name,
      [adPortalDestinationText.name]: '',
      [adType.name]: ServerAdFormatType[row.type],
      [campaignObjective.name]: CampaignObjectiveType.VISITS,
      [compositeReviewDecision.name]: row.composite_review_decision,
    };
  }

  if (ServerAdFormatType[row.type] === AdFormatType.SEARCH) {
    return {
      [adDestinationUniverseId.name]: row.search_ad_metadata?.target_universe_id,
      [adName.name]: row.name,
      [adPortalDestinationText.name]: '',
      [adType.name]: ServerAdFormatType[row.type],
      [campaignObjective.name]: CampaignObjectiveType.VISITS,
      [compositeReviewDecision.name]: row.composite_review_decision,
    };
  }

  if (ServerAdFormatType[row.type] === AdFormatType.VIDEO) {
    return {
      [adAssetHeight.name]: row.video_ad_metadata?.asset_metadata.height,
      [adAssetWidth.name]: row.video_ad_metadata?.asset_metadata.width,
      [adName.name]: row.name,
      [adType.name]: ServerAdFormatType[row.type],
      [adVideoAssetId.name]: row.video_ad_metadata?.asset_metadata.asset_id,
      [campaignObjective.name]: row.campaignObjective,
      [compositeReviewDecision.name]: row.composite_review_decision,
    };
  }

  return {
    [adAssetHeight.name]: row.display_ad_metadata?.asset_metadata.height,
    [adAssetId.name]: row.display_ad_metadata?.asset_metadata.asset_id,
    [adAssetWidth.name]: row.display_ad_metadata?.asset_metadata.width,
    [adName.name]: row.name,
    [adType.name]: ServerAdFormatType[row.type],
    [campaignObjective.name]: CampaignObjectiveType.AWARENESS,
    [compositeReviewDecision.name]: row.composite_review_decision,
  };
}

export const editAdValidationSchema = Yup.object().shape({
  [adName.name]: adNameValidation,
});
