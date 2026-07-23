import * as Yup from 'yup';

import { ServerCountryCode, ServerRegionCode } from '@constants/locationAutocomplete';
import {
  AgeBucketCriteria,
  AgeCriteria,
  BillableViewDurationType,
  DeviceCriteria,
  GenderCriteria,
  GenreCriteria,
  LanguageCriteria,
  MixedRegionAndCountryCriteria,
} from '@modules/clients/ads/adsClientTypes';
import {
  getEndUserAdSetAgeBucketTargeting,
  getEndUserAdSetAgeTargeting,
  getEndUserAdSetAuctionType,
  getEndUserAdSetDeviceTargeting,
  getEndUserAdSetExperienceTypesContainer,
  getEndUserAdSetGenderTargeting,
  getEndUserAdSetGenreTargeting,
  getEndUserAdSetLanguageTargeting,
  getEndUserAdSetRegionAndCountryTargeting,
  mapServerBidTypeToFormik,
  mapServerBrandSuitabilityTypeToFormik,
  microUsdToUsd,
} from '@modules/clients/ads/serverClientTransformationUtilities';
import {
  adSetBidValueUsdValidationConstructor,
  adSetNameValidation,
} from '@modules/creation/wizard/models/createCampaignWizard/createCampaignWizardModel';
import { AdFormatType } from '@type/ad';
import { AdSetAuctionType, AdSetBidType } from '@type/adSet';
import { TODOFIXANY } from 'app/shared/types';

export const editAdSetComponentModel = {
  formField: {
    adSetAgeBucketTargeting: {
      label: 'Ages',
      name: 'adSetAgeBucketTargeting',
      requiredErrorMsg: 'Age selection is required',
    },
    adSetAgeTargeting: {
      label: 'Age Range',
      name: 'adSetAgeTargeting',
      requiredErrorMsg: 'Age range is required',
    },
    adSetAuctionType: {
      label: 'Auction Type',
      name: 'adSetAuctionType',
      requiredErrorMsg: 'Ad set auction type is required',
    },
    adSetBidType: {
      label: 'Ad Set Bid Type',
      name: 'adSetBidType',
      requiredErrorMsg: 'Ad set bid type is required',
    },
    adSetBidValueUsd: {
      label: 'Max Bid',
      name: 'adSetBidValueUsd',
      requiredErrorMsg: 'Ad set bid amount is required',
    },
    adSetBrandSuitabilityType: {
      label: 'Brand Suitability',
      name: 'adSetBrandSuitabilityType',
    },
    adSetDeviceTargeting: {
      label: 'Device(s)',
      name: 'adSetDeviceTargeting',
      requiredErrorMsg: 'Device selection is required',
    },
    adSetFrequencyCapOn: {
      label: 'Frequency Cap On',
      name: 'adSetFrequencyCapOn',
    },
    adSetFrequencyCapValue: {
      label: 'Frequency Cap Value',
      name: 'adSetFrequencyCapValue',
    },
    adSetGenderTargeting: {
      label: 'Gender',
      name: 'adSetGenderTargeting',
    },
    adSetGenreTargeting: {
      label: 'Genre(s)',
      name: 'adSetGenreTargeting',
      requiredErrorMsg: 'At least one genre must be selected',
    },
    // Editable fields: bid amount, name
    adSetId: {
      label: 'Ad Set Id',
      name: 'adSetId',
    },
    adSetLanguageTargeting: {
      label: 'Language(s)',
      name: 'adSetLanguageTargeting',
      requiredErrorMsg: 'Between 1 and 10 languages are required',
    },
    adSetMixedRegionAndCountryTargeting: {
      label: 'Location(s)',
      name: 'adSetMixedRegionAndCountryTargeting',
      requiredErrorMsg: 'Between 1 and 15 locations are required',
    },
    adSetName: {
      label: 'Ad Set Name',
      name: 'adSetName',
      requiredErrorMsg: 'Ad set name is required',
    },
    adSetPaidAccess: {
      label: 'Paid-access experiences',
      name: 'adSetPaidAccess',
    },
    adSetPlacementType: {
      label: 'Ad Placement',
      name: 'adSetPlacementType',
      requiredErrorMsg: 'Ad Placement selection is required',
    },
    adSetRestrictedMaturity: {
      label: '18+ experiences',
      name: 'adSetRestrictedMaturity',
    },
    adSetSpecialExperienceSelectionToggledOn: {
      label: 'Paid-access or 18+ experiences',
      name: 'adSetSpecialExperienceSelectionToggledOn',
    },
    adType: {
      label: 'Ad Set Ad Type',
      name: 'adType',
    },
    billableViewDuration: {
      label: 'Billable View Duration',
      name: 'billableViewDuration',
      requiredErrorMsg: 'Ad set billable view durations are required',
    },
    // payment method for the campaign contains the adset
    campaignPaymentMethod: {
      label: 'Payment Method',
      name: 'campaignPaymentMethod',
      requiredErrorMsg: 'Campaign Payment Method is required',
    },
  },
  formId: 'editAdSetComponent',
};

const {
  formField: {
    adSetAgeBucketTargeting,
    adSetAgeTargeting,
    adSetAuctionType,
    adSetBidType,
    adSetBidValueUsd,
    adSetBrandSuitabilityType,
    adSetDeviceTargeting,
    adSetFrequencyCapOn,
    adSetFrequencyCapValue,
    adSetGenderTargeting,
    adSetGenreTargeting,
    adSetId,
    adSetLanguageTargeting,
    adSetMixedRegionAndCountryTargeting,
    adSetName,
    adSetPaidAccess,
    adSetRestrictedMaturity,
    adSetSpecialExperienceSelectionToggledOn,
    adType,
    billableViewDuration,
  },
} = editAdSetComponentModel;

interface EditCampaignComponentInitialValuesType {
  adSetAgeBucketTargeting: AgeBucketCriteria;
  adSetAgeTargeting: AgeCriteria;
  adSetAuctionType: AdSetAuctionType;
  adSetBidType: AdSetBidType;
  adSetBidValueUsd: number;
  adSetBrandSuitabilityType: string;
  adSetDeviceTargeting: DeviceCriteria;
  adSetFrequencyCapOn: boolean;
  adSetFrequencyCapValue: number;
  adSetGenderTargeting: GenderCriteria;
  adSetGenreTargeting: GenreCriteria;
  adSetId: string;
  adSetLanguageTargeting: LanguageCriteria;
  adSetMixedRegionAndCountryTargeting: MixedRegionAndCountryCriteria;
  adSetName: string;
  adType: AdFormatType;
}

export function getEditAdSetInitialValues(
  row: TODOFIXANY,
): Partial<EditCampaignComponentInitialValuesType> {
  const bidType = mapServerBidTypeToFormik(row.bidding_strategy.bid_type);
  const { paidAccess, seventeenPlus, toggleOn } = getEndUserAdSetExperienceTypesContainer(row);
  return {
    [adSetAgeBucketTargeting.name]: getEndUserAdSetAgeBucketTargeting(row),
    [adSetAgeTargeting.name]: getEndUserAdSetAgeTargeting(row),
    [adSetAuctionType.name]: getEndUserAdSetAuctionType(row.auction_type),
    [adSetBidType.name]: mapServerBidTypeToFormik(row.bidding_strategy.bid_type),
    [adSetBidType.name]: bidType,
    [adSetBidValueUsd.name]: microUsdToUsd(row.bidding_strategy.bid_value_micro_usd),
    [adSetBrandSuitabilityType.name]: mapServerBrandSuitabilityTypeToFormik(row.brand_suitability),
    [adSetDeviceTargeting.name]: getEndUserAdSetDeviceTargeting(row),
    [adSetFrequencyCapOn.name]: row.frequency_capping_rules?.length,
    [adSetFrequencyCapValue.name]:
      row.frequency_capping_rules?.length && row.frequency_capping_rules?.[0]?.value,
    [adSetGenderTargeting.name]: getEndUserAdSetGenderTargeting(row),
    [adSetGenreTargeting.name]: getEndUserAdSetGenreTargeting(row),
    [adSetId.name]: row.id,
    [adSetLanguageTargeting.name]: getEndUserAdSetLanguageTargeting(row),
    [adSetMixedRegionAndCountryTargeting.name]: getEndUserAdSetRegionAndCountryTargeting(row),
    [adSetName.name]: row.name,
    [adSetPaidAccess.name]: paidAccess,
    [adSetRestrictedMaturity.name]: seventeenPlus,
    [adSetSpecialExperienceSelectionToggledOn.name]: toggleOn,
    [adType.name]: row.adType,
    [billableViewDuration.name]:
      bidType === AdSetBidType.CPV15 ? BillableViewDurationType.FIFTEEN_SECONDS : undefined,
  };
}

export function editAdSetValidationSchema(
  cpmMinimumBidUsd: number,
  cptMinimumBidUsd: number,
  cpmMaximumBidUsd: number,
  cptMaximumBidUsd: number,
  tileAdsMinimumBidValueUsd: number,
  portalAdsMaximumBidValueUsd: number,
  tileAdsMaximumBidValueUsd: number,
  coreRegionFloorPriceUsd: number,
  strategicRegionFloorPriceUsd: number,
  opportunisticRegionFloorPriceUsd: number,
  mixedRegionFloorPriceUsd: number,
  coreRegionCodeList: ServerRegionCode[],
  strategicRegionCodeList: ServerRegionCode[],
  opportunisticRegionCodeList: ServerRegionCode[],
  coreCountryOverrideCodeList: ServerCountryCode[],
  cpcFloorPriceUsd: number,
  cpcCeilingPriceUsd: number,
  overrides: TODOFIXANY,
) {
  return Yup.object().shape({
    [adSetBidValueUsd.name]: adSetBidValueUsdValidationConstructor({
      coreCountryOverrideCodeList,
      coreRegionCodeList,
      coreRegionFloorPriceUsd,
      cpcCeilingPriceUsd,
      cpcFloorPriceUsd,
      cpmMaximumBidUsd,
      cpmMinimumBidUsd,
      cptMaximumBidUsd,
      cptMinimumBidUsd,
      mixedRegionFloorPriceUsd,
      opportunisticRegionCodeList,
      opportunisticRegionFloorPriceUsd,
      overrides,
      portalAdsMaximumBidValueUsd,
      strategicRegionCodeList,
      strategicRegionFloorPriceUsd,
      tileAdsMaximumBidValueUsd,
      tileAdsMinimumBidValueUsd,
    }),
    [adSetName.name]: adSetNameValidation,
  });
}
