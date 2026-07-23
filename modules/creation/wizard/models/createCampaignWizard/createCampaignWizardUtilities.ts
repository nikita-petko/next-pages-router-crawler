import { BillableViewDurationType } from '@modules/clients/ads/adsClientTypes';
import {
  convertPaymentTypeServerToClient,
  getAdSetFrequencyCapInfo,
  getEndUserAdSetAgeBucketTargeting,
  getEndUserAdSetAuctionType,
  getEndUserAdSetDeviceTargeting,
  getEndUserAdSetGenderTargeting,
  getEndUserAdSetGenreTargeting,
  getEndUserAdSetRegionAndCountryTargeting,
  getFromServerCampaignBudgetInfo,
  getFromServerCampaignObjective,
  mapServerAdTypeToFormik,
  mapServerBidTypeToFormik,
  mapServerBrandSuitabilityTypeToFormik,
  microUsdToUsd,
} from '@modules/clients/ads/serverClientTransformationUtilities';
import {
  getGameThumbnailByUniverseId,
  getImageThumbnail,
} from '@modules/clients/thumbnails/thumbnailsClient';
import {
  CreateCampaignWizardInitialValuesType,
  createCampaignWizardModel,
} from '@modules/creation/wizard/models/createCampaignWizard/createCampaignWizardModel';
import { getUniverses } from '@services/ads/getUniversesService';
import { AdFormatType } from '@type/ad';
import { AdSetBidType } from '@type/adSet';
import { GetTimezoneOffsetMs } from '@utils/date';
import { TODOFIXANY } from 'app/shared/types';

const {
  adAssetHeight,
  adAssetId,
  adAssetWidth,
  adDestinationUniverseId,
  adName,
  adPortalDestinationPlaceId,
  adPortalDestinationText,
  adSetAgeBucketTargeting,
  adSetAuctionType,
  adSetBidType,
  adSetBidValueUsd,

  adSetBrandSuitabilityType,
  adSetDeviceTargeting,
  adSetFrequencyCapOn,
  adSetFrequencyCapValue,
  adSetGenderTargeting,
  adSetGenreTargeting,
  adSetMixedRegionAndCountryTargeting,
  adSetName,
  adSetPaidAccess,
  adSetRestrictedMaturity,
  adSetSpecialExperienceSelectionToggledOn,
  adType,
  adVideoAssetId,
  billableViewDuration,
  campaignAdvertiserName,
  campaignAdvertiserNameError,

  campaignBudgetCapUsd,
  campaignBudgetType,
  campaignEndDate,
  campaignEndTimestampMs,
  campaignName,
  campaignObjective,
  campaignPaymentMethod,
  campaignStartDate,
  campaignStartTimestampMs,
  compositeReviewDecision,
} = createCampaignWizardModel.formField;

export const getUpdatedFormikValues = (
  campaign: TODOFIXANY,
  adSet: TODOFIXANY,
  ad: TODOFIXANY,
  timeZone: string,
) => {
  let updatedFormikValues: Partial<CreateCampaignWizardInitialValuesType> = {};

  if (campaign) {
    const campaignObjectiveValue = getFromServerCampaignObjective(campaign);
    const { budgetType, budgetUsd } = getFromServerCampaignBudgetInfo(campaign);
    // Set start time to now and end time to the same duration as the original campaign
    const startTimestampMs = Date.now();
    const endTimestampMs =
      startTimestampMs + (campaign.end_timestamp_ms - campaign.start_timestamp_ms);

    updatedFormikValues = {
      ...updatedFormikValues,
      [campaignAdvertiserName.name]: campaign?.advertiser_name?.value || '',
      [campaignAdvertiserNameError.name]: campaign?.advertiser_name?.value
        ? ''
        : 'Advertiser name is required',
      [campaignBudgetCapUsd.name]: budgetUsd,
      [campaignBudgetType.name]: budgetType,
      [campaignEndDate.name]: endTimestampMs + GetTimezoneOffsetMs(timeZone),

      [campaignEndTimestampMs.name]: endTimestampMs + GetTimezoneOffsetMs(timeZone),
      [campaignName.name]: `${campaign?.name}_Copy 1`,

      [campaignObjective.name]: campaignObjectiveValue,
      [campaignPaymentMethod.name]: convertPaymentTypeServerToClient(campaign?.payment_type),
      [campaignStartDate.name]: startTimestampMs + GetTimezoneOffsetMs(timeZone),
      [campaignStartTimestampMs.name]: startTimestampMs + GetTimezoneOffsetMs(timeZone),
    };

    if (adSet) {
      const bidType = mapServerBidTypeToFormik(adSet.bidding_strategy.bid_type);
      const { capValue, frequencyCapOn } = getAdSetFrequencyCapInfo(adSet);
      const ageBucketTargeting = getEndUserAdSetAgeBucketTargeting(adSet);
      const deviceTargeting = getEndUserAdSetDeviceTargeting(adSet);
      const genderTargeting = getEndUserAdSetGenderTargeting(adSet);
      const regionAndCountryTargeting = getEndUserAdSetRegionAndCountryTargeting(adSet);
      const genreTargeting = getEndUserAdSetGenreTargeting(adSet);
      const isRestrictedMaturity = Boolean(adSet?.promotes_seventeen_plus_universes);
      const isPaidAccess = bidType === AdSetBidType.COST_PER_CLICK;

      updatedFormikValues = {
        ...updatedFormikValues,
        [adSetAuctionType.name]: getEndUserAdSetAuctionType(adSet.auction_type),
        [adSetBidType.name]: bidType,
        [adSetBidType.name]: bidType,
        [adSetBidValueUsd.name]: microUsdToUsd(adSet.bidding_strategy.bid_value_micro_usd),
        [adSetBrandSuitabilityType.name]: mapServerBrandSuitabilityTypeToFormik(
          adSet.brand_suitability,
        ),
        [adSetFrequencyCapOn.name]: frequencyCapOn,
        [adSetFrequencyCapValue.name]: capValue,
        [adSetName.name]: adSet.name,
        [adSetPaidAccess.name]: isPaidAccess,
        [adSetRestrictedMaturity.name]: isRestrictedMaturity,
        [adSetSpecialExperienceSelectionToggledOn.name]: isRestrictedMaturity || isPaidAccess,
        [billableViewDuration.name]:
          bidType === AdSetBidType.CPV15 ? BillableViewDurationType.FIFTEEN_SECONDS : undefined,

        ...((regionAndCountryTargeting?.regions?.length ||
          regionAndCountryTargeting?.countries?.length) && {
          [adSetMixedRegionAndCountryTargeting.name]: regionAndCountryTargeting,
        }),
        ...(genderTargeting?.gender && { [adSetGenderTargeting.name]: genderTargeting }),
        ...(ageBucketTargeting?.ageBuckets && {
          [adSetAgeBucketTargeting.name]: ageBucketTargeting,
        }),
        ...(deviceTargeting?.devices && { [adSetDeviceTargeting.name]: deviceTargeting }),
        ...(genreTargeting?.genres && { [adSetGenreTargeting.name]: genreTargeting }),
      };
    }

    if (ad) {
      const adFormatType = mapServerAdTypeToFormik(ad?.type);
      switch (adFormatType) {
        case AdFormatType.PORTAL:
          updatedFormikValues = {
            ...updatedFormikValues,
            [adAssetHeight.name]: ad.portal_ad_metadata?.banner_asset_metadata.height,
            [adAssetId.name]: ad.portal_ad_metadata?.banner_asset_metadata.asset_id,
            [adAssetWidth.name]: ad.portal_ad_metadata?.banner_asset_metadata.width,
            [adDestinationUniverseId.name]: ad.portal_ad_metadata?.universe_id,
            [adName.name]: ad.name,
            [adPortalDestinationPlaceId.name]: ad.portal_ad_metadata?.target_place_id,
            [adPortalDestinationText.name]: ad.portal_ad_metadata?.text,
            [adType.name]: adFormatType,
            [compositeReviewDecision.name]:
              ad.portal_ad_metadata?.banner_asset_metadata?.asset_status,
          };
          break;
        case AdFormatType.TILE:
          updatedFormikValues = {
            ...updatedFormikValues,
            [adDestinationUniverseId.name]: ad.sponsored_universe_ad_metadata?.target_universe_id,
            [adName.name]: ad.name,
            [adPortalDestinationPlaceId.name]:
              ad.sponsored_universe_ad_metadata?.target_universe_id,
            [adType.name]: adFormatType,
          };
          break;
        case AdFormatType.SEARCH:
          updatedFormikValues = {
            ...updatedFormikValues,
            [adDestinationUniverseId.name]: ad.search_ad_metadata?.target_universe_id,
            [adName.name]: ad.name,
            [adPortalDestinationPlaceId.name]: ad.search_ad_metadata?.target_universe_id,
            [adType.name]: adFormatType,
          };
          break;
        case AdFormatType.VIDEO:
          updatedFormikValues = {
            ...updatedFormikValues,
            [adName.name]: ad.name,
            [adType.name]: adFormatType,
            [adVideoAssetId.name]: ad.video_ad_metadata?.asset_metadata.asset_id,
            [compositeReviewDecision.name]: ad.video_ad_metadata?.asset_metadata.asset_status,
          };
          break;
        default:
          updatedFormikValues = {
            ...updatedFormikValues,
            [adAssetHeight.name]: ad.display_ad_metadata?.asset_metadata.height,
            [adAssetId.name]: ad.display_ad_metadata?.asset_metadata.asset_id,
            [adAssetWidth.name]: ad.display_ad_metadata?.asset_metadata.width,
            [adName.name]: ad.name,
            [adType.name]: adFormatType,
            [compositeReviewDecision.name]: ad.display_ad_metadata?.asset_metadata?.asset_status,
          };
          break;
      }
    }
  }

  return updatedFormikValues;
};

export const fetchAssetThumbnailInfo = async (assetId: number) => {
  try {
    const thumbnailResponse = await getImageThumbnail(assetId);
    const { imageUrl } = thumbnailResponse.data[0];
    return imageUrl;
  } catch (e) {
    throw new Error(`error getting thumbnail url for assetId ${assetId}`);
  }
};

export const fetchGameThumbnailInfo = async (universeId: number) => {
  try {
    const thumbnailResponse = await getGameThumbnailByUniverseId(universeId);
    const { imageUrl } = thumbnailResponse.data[0];
    return imageUrl;
  } catch (e) {
    throw new Error(`error getting thumbnail url for universeId ${universeId}`);
  }
};

export const fetchUniverseName = async (universeId: number) => {
  try {
    const universeResponse = await getUniverses([universeId]);
    const { name } = universeResponse.data[0];
    return name;
  } catch (e) {
    throw new Error(`error getting universe name for for universeId ${universeId}`);
  }
};
