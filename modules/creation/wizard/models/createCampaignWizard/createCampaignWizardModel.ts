import * as Yup from 'yup';

import { CampaignObjectiveType } from '@constants/campaignBuilder';
import { ServerCountryCode, ServerRegionCode } from '@constants/locationAutocomplete';
import {
  AdCreationType,
  AgeBucketCriteria,
  AgeBucketType,
  AgeCriteria,
  AssetType,
  BudgetType,
  CampaignBaseType,
  DeviceCriteria,
  DeviceType,
  Gender,
  GenderCriteria,
  GenreCriteria,
  LanguageCriteria,
  MixedRegionAndCountryCriteria,
  OrganizationType,
  PaymentMethodType,
  ServerAdFormatType,
} from '@modules/clients/ads/adsClientTypes';
import {
  mapBidTypeFormikToServer,
  mapMiscAdTypeToServerAdType,
  mapMiscBidTypeToServerBidType,
  microUsdToUsd,
  usdToMicroUsd,
} from '@modules/clients/ads/serverClientTransformationUtilities';
import {
  formatDateToMMDDYYYY,
  getDurationInDays,
} from '@modules/miscellaneous/utils/dateUtilities';
import { AdFormatType, ServerAdAssetCompositeReviewDecisionType } from '@type/ad';
import {
  AdSetAuctionType,
  AdSetBidType,
  AdSetBrandSuitabilityType,
  AdSetCreationType,
  ServerAdSetBidType,
} from '@type/adSet';
import { UniverseShapeType } from '@type/universe';
import { MicroUsdToUsdStringRoundedUp } from '@utils/currency';
import {
  ageBuckets,
  AllGenresObj,
  allMaxAges,
  allMinAges,
  devices,
  firstPriceBidCoreRegionAndCountryOverrideList,
  languages,
  regions,
  regionsAndCountriesSortedAlph,
  RegionsAndLocationsFormInputObj,
} from 'app/shared/formDefaults';
import { TODOFIXANY } from 'app/shared/types';
import { detectSpecialCharacters, removeTabsAndLeadingSpaces } from 'app/util/fns';

export const createCampaignWizardModel = {
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
    adGameThumbnailUrl: {
      name: 'adGameThumbnailUrl',
    },
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
      requiredErrorMsg: 'Ad set brand suitability type is required',
    },
    adSetDeviceTargeting: {
      label: 'Device(s)',
      name: 'adSetDeviceTargeting',
      requiredErrorMsg: 'Device selection is required',
    },
    adSetFormatType: {
      label: 'Ad Format',
      name: 'adSetFormatType',
      requiredErrorMsg: 'Ad Format selection is required',
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
      requiredErrorMsg: 'Location selection is required',
    },
    adSetMixedRegionAndCountryTargetingSearchTerm: {
      label: 'Location Search Term',
      name: 'adSetMixedRegionAndCountryTargetingSearchTerm',
      requiredErrorMsg: '',
    },
    adSetName: {
      label: 'Ad Set Name',
      name: 'adSetName',
      requiredErrorMsg: 'Ad set name is required',
    },
    // Whether the ad set is checked as paid access
    adSetPaidAccess: {
      label: 'Paid-access experiences',
      name: 'adSetPaidAccess',
    },
    // Whether the ad set is checked as restricted (18+) age rating
    adSetRestrictedMaturity: {
      label: 'Restricted (18+) experiences',
      name: 'adSetRestrictedMaturity',
    },
    // This only controls whether the paid-access/restricted (18+) checkboxes show up
    // This can be true without the ad set being selected as paid access or restricted (18+)
    adSetSpecialExperienceSelectionToggledOn: {
      label: 'Paid-access or restricted (18+) experiences',
      name: 'adSetSpecialExperienceSelectionToggledOn',
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
    adVideoDurationMs: {
      name: 'adVideoDurationMs',
    },
    billableViewDuration: {
      label: 'Billable View Duration',
      name: 'billableViewDuration',
      requiredErrorMsg: 'A valid billable view duration must be selected',
    },
    // used to check if user has sufficient fund to create campaign with ad credit
    campaignAdCreditBalanceMicro: {
      name: 'campaignAdCreditBalanceMicro',
    },
    campaignAdvertiserName: {
      label: 'Advertiser Name',
      name: 'campaignAdvertiserName',
      requiredErrorMsg: 'Advertiser name is required',
    },
    // used to check if advertiser name has error
    campaignAdvertiserNameError: {
      name: 'campaignAdvertiserNameError',
    },
    campaignBudgetCapUsd: {
      // Needs to be Daily or Lifetime
      label: 'Daily Budget',
      name: 'campaignBudgetCapUsd',
      requiredErrorMsg: 'Campaign budget is required',
    },
    campaignBudgetType: {
      label: 'Campaign Budget Type',
      name: 'campaignBudgetType',
    },
    // hold info for start date picker
    // time will be stored as 12:00am for the date
    campaignEndDate: {
      label: 'End Date',
      name: 'campaignEndDate',
      requiredErrorMsg: 'End date is required',
    },
    // hold info for start time picker
    campaignEndTime: {
      name: 'campaignEndTime',
      requiredErrorMsg: 'End time is required',
    },
    // final end time sent to server
    campaignEndTimestampMs: {
      label: 'End Date',
      name: 'campaignEndTimestampMs',
      requiredErrorMsg: 'End date is required',
    },
    // used to check if user picks datetime in the past
    campaignFormOpenedTime: {
      name: 'campaignFormOpenedTime',
    },
    // used to determine if user has set end date for campaign
    campaignHasEndDate: {
      name: 'campaignHasEndDate',
    },
    // Not used when creating a new campaign
    campaignId: {
      label: 'Campaign Id',
      name: 'campaignId',
    },
    campaignName: {
      label: 'Campaign Name',
      name: 'campaignName',
      requiredErrorMsg: 'Campaign name is required',
    },
    campaignObjective: {
      label: 'Campaign Objective',
      name: 'campaignObjective',
      requiredErrorMsg: 'Campaign objective is required',
    },
    campaignPaymentMethod: {
      label: 'Payment Method',
      name: 'campaignPaymentMethod',
      requiredErrorMsg: 'Campaign Payment Method is required',
    },
    // hold info for start date picker
    // time will be stored as 12:00am for the date
    campaignStartDate: {
      label: 'Start Date',
      name: 'campaignStartDate',
      requiredErrorMsg: 'Start date is required',
    },
    // hold info for start time picker
    campaignStartTime: {
      name: 'campaignStartTime',
      requiredErrorMsg: 'Start time is required',
    },
    // final start time sent to server
    campaignStartTimestampMs: {
      label: 'Start Date',
      name: 'campaignStartTimestampMs',
      requiredErrorMsg: 'Start date is required',
    },
    compositeReviewDecision: {
      label: 'Composite Review Decision',
      name: 'compositeReviewDecision',
    },
  },
  formId: 'createCampaignWizard',
};

const msInADay = 1000 * 60 * 60 * 24;
const msInTwoHours = 1000 * 60 * 60 * 2;

const {
  formField: {
    adAssetHeight,
    adAssetId,
    adAssetWidth,
    adDestinationUniverseId,
    adName,
    adPortalDestinationPlaceId,
    adPortalDestinationText,
    adSetAgeBucketTargeting,
    adSetAgeTargeting,
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
    adSetMixedRegionAndCountryTargetingSearchTerm,
    adSetName,
    adSetPaidAccess,
    adSetRestrictedMaturity,
    adSetSpecialExperienceSelectionToggledOn,
    adType,
    adVideoAssetId,
    campaignAdvertiserName,
    campaignAdvertiserNameError,
    campaignBudgetCapUsd,
    campaignBudgetType,
    campaignEndDate,
    campaignEndTime,
    campaignEndTimestampMs,
    campaignId,
    campaignName,
    campaignObjective,
    campaignPaymentMethod,
    campaignStartDate,
    campaignStartTime,
    campaignStartTimestampMs,
    compositeReviewDecision,
  },
} = createCampaignWizardModel;

export const isBidTypeFirstPrice = (bidType: AdSetAuctionType) =>
  bidType === AdSetAuctionType.AUCTION_TYPE_FIRST_PRICE ||
  bidType === AdSetAuctionType.AUCTION_TYPE_FIRST_PRICE_PRIORITY;

export const getEndUserDisplayCurrency = (paymentMethodVal: string) => {
  let textToReturn;
  switch (paymentMethodVal) {
    case PaymentMethodType.AD_CREDIT:
      textToReturn = 'Ad Credit';
      break;
    case PaymentMethodType.CARD:
    case PaymentMethodType.INVOICE:
      textToReturn = 'USD';
      break;
    default:
  }

  return textToReturn || '';
};

export const noBlankInputTestParams: [string | undefined, string, (val: string) => boolean] = [
  'blank-in-user-input',
  'Please enter something more descriptive',
  (val: string) => {
    return !(removeTabsAndLeadingSpaces(`${val}`) === '');
  },
];

const noSpecialCharactersTestParam: [string | undefined, string, (val: string) => boolean] = [
  'special-characters-in-user-input',
  'We do not allow these characters for this field: & < > " \'',
  (val: string) => {
    return !detectSpecialCharacters(`${val}`);
  },
];

export const adSetNameValidation = Yup.string()
  .max(128, 'Name must be 128 characters or less')
  .required(`${adSetName.requiredErrorMsg}`)
  // @ts-ignore
  .test(...noBlankInputTestParams)
  // @ts-ignore
  .test(...noSpecialCharactersTestParam);

export enum MarketType {
  UNSPECIFIED,
  CORE,
  STRATEGIC,
  OPPORTUNISTIC,
  MIXED,
}

export function getTargetRegionMarketType(
  regionCodes: ServerRegionCode[],
  coreRegionCodeList: ServerRegionCode[],
  strategicRegionCodeList: ServerRegionCode[],
  coreCountryOverrideCodeList: ServerCountryCode[],
  countries: TODOFIXANY[],
) {
  let targetedMarketType = MarketType.UNSPECIFIED as MarketType;
  let hasCoreRegion = false;
  let hasNoneCoreRegion = false;
  let hasWECoreCountry = false;
  let hasWEStrategicCountry = false;
  if (countries) {
    countries.forEach((country: TODOFIXANY) => {
      if (coreCountryOverrideCodeList.includes(country.value)) {
        hasWECoreCountry = true;
      } else if (country.regionCode === 'WESTERN_EUROPE') {
        hasWEStrategicCountry = true;
      }
    });
  }

  if (regionCodes.length === 0) {
    // unselected => treat as default, which is all regions
    targetedMarketType = MarketType.MIXED;
  } else {
    regionCodes.forEach((r: TODOFIXANY) => {
      let current = MarketType.UNSPECIFIED;
      if (r === ServerRegionCode.VALUE_ALL) {
        // ALL means mixed
        current = MarketType.MIXED;
        hasCoreRegion = true;
        hasNoneCoreRegion = true;
      } else if (r === ServerRegionCode.VALUE_WESTERN_EUROPE) {
        // Western Europe contains both core and strategic regions
        if (
          (hasWECoreCountry && hasWEStrategicCountry) ||
          (!hasWECoreCountry && !hasWEStrategicCountry)
        ) {
          current = MarketType.MIXED;
          hasCoreRegion = true;
          hasNoneCoreRegion = true;
        } else if (hasWECoreCountry) {
          current = MarketType.CORE;
          hasCoreRegion = true;
        } else if (hasWEStrategicCountry) {
          current = MarketType.STRATEGIC;
          hasNoneCoreRegion = true;
        }
      } else if (coreRegionCodeList.includes(r)) {
        current = MarketType.CORE;
        hasCoreRegion = true;
      } else if (strategicRegionCodeList.includes(r)) {
        current = MarketType.STRATEGIC;
        hasNoneCoreRegion = true;
      } else {
        current = MarketType.OPPORTUNISTIC;
        hasNoneCoreRegion = true;
      }
      if (targetedMarketType === MarketType.UNSPECIFIED) {
        targetedMarketType = current;
      } else if (hasNoneCoreRegion && hasCoreRegion) {
        targetedMarketType = MarketType.MIXED;
      }
    });
  }
  return targetedMarketType;
}

export const convertAdSetMixedRegionAndCountryTargetingIntoRegions = (
  adSetMixedRegionAndCountryTargetingInfo: TODOFIXANY,
): Array<Partial<RegionsAndLocationsFormInputObj>> => {
  const includedRegions = adSetMixedRegionAndCountryTargetingInfo?.regions || [];
  const includedCountries = adSetMixedRegionAndCountryTargetingInfo?.countries || [];
  const allParentRegionCodesOfCountries = includedCountries.map((countryObj: TODOFIXANY) => {
    return countryObj.regionCode;
  });

  const regionCodeToRegionsList = allParentRegionCodesOfCountries.map((regionCode: string) => {
    const foundRegion = regionsAndCountriesSortedAlph.find((regionAndCountryObj: TODOFIXANY) => {
      return regionAndCountryObj.regionCode === regionCode && regionAndCountryObj.parentRegion;
    });
    return foundRegion;
  });

  const allSelectedRegions = [...includedRegions, ...regionCodeToRegionsList];
  const regionSet: TODOFIXANY = {};

  allSelectedRegions.filter(Boolean).forEach((regionObj: RegionsAndLocationsFormInputObj) => {
    const { regionCode } = regionObj;
    regionSet[regionCode] = regionObj;
  });

  return Object.values(regionSet);
};

export const adSetBidValueUsdValidationConstructor = ({
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
  opportunisticRegionFloorPriceUsd,
  overrides = {},
  portalAdsMaximumBidValueUsd,
  strategicRegionCodeList,
  strategicRegionFloorPriceUsd,
  tileAdsMaximumBidValueUsd,
  tileAdsMinimumBidValueUsd,
}: {
  coreCountryOverrideCodeList: ServerCountryCode[];
  coreRegionCodeList: ServerRegionCode[];
  coreRegionFloorPriceUsd: number;
  cpcCeilingPriceUsd: number;
  cpcFloorPriceUsd: number;
  cpmMaximumBidUsd: number;
  cpmMinimumBidUsd: number;
  cptMaximumBidUsd: number;
  cptMinimumBidUsd: number;
  mixedRegionFloorPriceUsd: number;
  opportunisticRegionCodeList: ServerRegionCode[];
  opportunisticRegionFloorPriceUsd: number;
  overrides: TODOFIXANY;
  portalAdsMaximumBidValueUsd: number;
  strategicRegionCodeList: ServerRegionCode[];
  strategicRegionFloorPriceUsd: number;
  tileAdsMaximumBidValueUsd: number;
  tileAdsMinimumBidValueUsd: number;
}) => {
  return Yup.number()
    .required(`${adSetBidValueUsd.requiredErrorMsg}`)
    .typeError('You must specify a number')
    .test('min-max-adset-bid', '', function (val, { createError }) {
      if (val === undefined) {
        return false;
      }

      let minimumBidValue;
      let maximumBidValue;
      let countries = [];

      const serverAdType = mapMiscAdTypeToServerAdType(this.parent.adType);
      const serverBidType = mapMiscBidTypeToServerBidType(this.parent.adSetBidType);

      const foundRegions = convertAdSetMixedRegionAndCountryTargetingIntoRegions(
        this.parent?.adSetMixedRegionAndCountryTargeting || [],
      );
      countries = this.parent?.adSetMixedRegionAndCountryTargeting?.countries || [];

      const isFirstPriceBidType = isBidTypeFirstPrice(this.parent.adSetAuctionType);

      const regionCodes = foundRegions.map((r: TODOFIXANY) => r.value);
      const targetedMarketType = getTargetRegionMarketType(
        regionCodes,
        coreRegionCodeList,
        strategicRegionCodeList,
        coreCountryOverrideCodeList,
        countries,
      );

      switch (serverBidType) {
        case ServerAdSetBidType.CPV15:
          if (targetedMarketType === MarketType.MIXED) {
            minimumBidValue =
              (overrides.videoMinBidMappingsMicroUsd &&
                microUsdToUsd(
                  overrides.videoMinBidMappingsMicroUsd.mixedRegionVideoCpv15FloorPriceMicroUsd,
                )) ||
              0.2;
            maximumBidValue = 1000.0;
          } else if (targetedMarketType === MarketType.CORE) {
            minimumBidValue =
              (overrides.videoMinBidMappingsMicroUsd &&
                microUsdToUsd(
                  overrides.videoMinBidMappingsMicroUsd.coreRegionVideoCpv15FloorPriceMicroUsd,
                )) ||
              0.1;
            maximumBidValue = 1000.0;
          } else if (targetedMarketType === MarketType.STRATEGIC) {
            minimumBidValue =
              (overrides.videoMinBidMappingsMicroUsd &&
                microUsdToUsd(
                  overrides.videoMinBidMappingsMicroUsd.strategicRegionVideoCpv15FloorPriceMicroUsd,
                )) ||
              0.1;
            maximumBidValue = 1000.0;
          } else {
            minimumBidValue =
              (overrides.videoMinBidMappingsMicroUsd &&
                microUsdToUsd(
                  overrides.videoMinBidMappingsMicroUsd
                    .opportunisticRegionVideoCpv15FloorPriceMicroUsd,
                )) ||
              0.1;
            maximumBidValue = 1000.0;
          }
          break;
        case ServerAdSetBidType.CPM:
          if (serverAdType === ServerAdFormatType.VIDEO) {
            if (targetedMarketType === MarketType.MIXED) {
              minimumBidValue =
                (overrides.videoMinBidMappingsMicroUsd &&
                  microUsdToUsd(
                    overrides.videoMinBidMappingsMicroUsd.mixedRegionVideoCpmFloorPriceMicroUsd,
                  )) ||
                4.0;
              maximumBidValue = 1000.0;
            } else if (targetedMarketType === MarketType.CORE) {
              minimumBidValue =
                (overrides.videoMinBidMappingsMicroUsd &&
                  microUsdToUsd(
                    overrides.videoMinBidMappingsMicroUsd.coreRegionVideoCpmFloorPriceMicroUsd,
                  )) ||
                5.0;
              maximumBidValue = 1000.0;
            } else if (targetedMarketType === MarketType.STRATEGIC) {
              minimumBidValue =
                (overrides.videoMinBidMappingsMicroUsd &&
                  microUsdToUsd(
                    overrides.videoMinBidMappingsMicroUsd.strategicRegionVideoCpmFloorPriceMicroUsd,
                  )) ||
                2.0;
              maximumBidValue = 1000.0;
            } else {
              minimumBidValue =
                (overrides.videoMinBidMappingsMicroUsd &&
                  microUsdToUsd(
                    overrides.videoMinBidMappingsMicroUsd
                      .opportunisticRegionVideoCpmFloorPriceMicroUsd,
                  )) ||
                2.0;
              maximumBidValue = 1000.0;
            }
          } else {
            minimumBidValue = cpmMinimumBidUsd;
            maximumBidValue = cpmMaximumBidUsd;
          }
          break;
        case ServerAdSetBidType.CPT: {
          maximumBidValue = portalAdsMaximumBidValueUsd;
          if (targetedMarketType === MarketType.MIXED) {
            minimumBidValue = mixedRegionFloorPriceUsd;
          } else if (targetedMarketType === MarketType.CORE) {
            minimumBidValue = coreRegionFloorPriceUsd;
          } else if (targetedMarketType === MarketType.STRATEGIC) {
            minimumBidValue = strategicRegionFloorPriceUsd;
          } else {
            minimumBidValue = opportunisticRegionFloorPriceUsd;
          }

          // if it is sponsored ads, just set the tileAdsMinBid
          if (serverAdType === ServerAdFormatType.TILE) {
            minimumBidValue = tileAdsMinimumBidValueUsd;
            maximumBidValue = tileAdsMaximumBidValueUsd;
          }
          break;
        }
        case ServerAdSetBidType.CPC: {
          minimumBidValue = cpcFloorPriceUsd;
          maximumBidValue = cpcCeilingPriceUsd;
          break;
        }
        default:
          minimumBidValue = Math.max(cpmMinimumBidUsd, cptMinimumBidUsd);
          maximumBidValue = Math.max(cpmMaximumBidUsd, cptMaximumBidUsd);
          break;
      }
      // if second price is enable and auction is first price, the sponsored ads bid value will follow the portal ads
      // Second price is what internal accounts default to
      if (isFirstPriceBidType) {
        // CPC bid type does not have special first price overrides
        if (serverAdType === ServerAdFormatType.TILE && serverBidType !== ServerAdSetBidType.CPC) {
          if (targetedMarketType === MarketType.CORE) {
            minimumBidValue = coreRegionFloorPriceUsd;
          } else if (targetedMarketType === MarketType.STRATEGIC) {
            minimumBidValue = strategicRegionFloorPriceUsd;
          } else if (targetedMarketType === MarketType.OPPORTUNISTIC) {
            minimumBidValue = opportunisticRegionFloorPriceUsd;
          } else {
            minimumBidValue = mixedRegionFloorPriceUsd;
          }
        }
      }

      // Special overrides for first price
      if (isFirstPriceBidType) {
        // CPC bid type does not have special first price overrides
        if (
          (serverAdType === ServerAdFormatType.TILE ||
            serverAdType === ServerAdFormatType.PORTAL) &&
          serverBidType !== ServerAdSetBidType.CPC
        ) {
          const allCountryCodes =
            this.parent?.adSetMixedRegionAndCountryTargeting?.countries.map(
              (item: TODOFIXANY) => item.value,
            ) || [];
          const allRegionCodes =
            this.parent?.adSetMixedRegionAndCountryTargeting?.regions.map(
              (item: TODOFIXANY) => item.value,
            ) || [];

          const containsAnyFirstPriceExceptions =
            allCountryCodes.some(
              (code: number) => firstPriceBidCoreRegionAndCountryOverrideList.countries[code],
            ) ||
            allRegionCodes.some(
              (code: number) => firstPriceBidCoreRegionAndCountryOverrideList.regions[code],
            );

          const containsOnlyFirstPriceExceptions =
            (allCountryCodes.length &&
              allCountryCodes.every(
                (code: number) => firstPriceBidCoreRegionAndCountryOverrideList.countries[code],
              )) ||
            (allRegionCodes.length &&
              allRegionCodes.every(
                (code: number) => firstPriceBidCoreRegionAndCountryOverrideList.regions[code],
              ));

          const containsNoCoreRegions =
            allCountryCodes.every(
              (code: number) => !firstPriceBidCoreRegionAndCountryOverrideList.countries[code],
            ) ||
            allRegionCodes.every(
              (code: number) => !firstPriceBidCoreRegionAndCountryOverrideList.regions[code],
            );

          // If contains no core regions strategicRegionFloorPriceUsd
          if (containsNoCoreRegions) {
            minimumBidValue = strategicRegionFloorPriceUsd;
          }

          // if contains mixed core regions: mixedRegionFloorPriceUsd
          if (containsAnyFirstPriceExceptions && !containsOnlyFirstPriceExceptions) {
            minimumBidValue = mixedRegionFloorPriceUsd;
          }

          // contains only core regions: coreRegionFloorPriceUsd
          if (containsOnlyFirstPriceExceptions) {
            minimumBidValue = coreRegionFloorPriceUsd;
          }
        }
      }

      if (val < minimumBidValue) {
        return createError({
          message: `Bid must be at least ${minimumBidValue.toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })} ${getEndUserDisplayCurrency(this.parent.campaignPaymentMethod)}`,
        });
      }
      if (val > maximumBidValue) {
        return createError({
          message: `Maximum bid is ${maximumBidValue.toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })} ${getEndUserDisplayCurrency(this.parent.campaignPaymentMethod)}`,
        });
      }
      return true;
    });
};

export const adNameValidation = Yup.string()
  .max(128, 'Name must be 128 characters or less')
  .required(`${adName.requiredErrorMsg}`)
  // @ts-ignore
  .test(...noBlankInputTestParams)
  // @ts-ignore
  .test(...noSpecialCharactersTestParam);

export function getCampaignValidationSchemaBase(
  dailyMaxBudgetUsd: number,
  isAdAccountManaged: boolean,
  isAdAccountInternal: boolean,
  campaignMinimumDailyBudgetUsd: number,
  timeZone: string,
) {
  return {
    [campaignBudgetCapUsd.name]: Yup.number()
      .required(`${campaignBudgetCapUsd.requiredErrorMsg}`)
      .typeError('You must specify a number')
      .test('min-max-campaign-budget', '', function (val, { createError }) {
        if (val === undefined) {
          return false;
        }

        // Don't let users move forward with the next step if their budget is below min (changes with the type).
        if (this.parent.campaignBudgetType === BudgetType.LIFETIME) {
          const durationInDays = getDurationInDays(
            this.parent.campaignStartTimestampMs,
            this.parent.campaignEndTimestampMs,
            timeZone,
          );
          // if the start / end date are invalid we cannot accurately calculate the
          // max daily budget - so we shouldn't show an error until the dates are valid
          const invalidCampaignDuration = this.parent.campaignEndTimestampMs
            ? this.parent.campaignEndTimestampMs - this.parent.campaignStartTimestampMs <= 0
            : false;

          const campaignMinLifetimeBudgetUsd = durationInDays * campaignMinimumDailyBudgetUsd;
          if (!invalidCampaignDuration && val < campaignMinLifetimeBudgetUsd) {
            return createError({
              message: `Minimum of ${campaignMinLifetimeBudgetUsd.toFixed(
                2,
              )} ${getEndUserDisplayCurrency(this.parent.campaignPaymentMethod)} required for the selected duration`,
            });
          }

          // Skip checking maximum budget if it's managed or internal account.
          if (isAdAccountManaged || isAdAccountInternal) {
            return true;
          }

          if (this.parent.campaignPaymentMethod === PaymentMethodType.AD_CREDIT) {
            const requiredBalance = usdToMicroUsd(val) / durationInDays;

            // check if ad balance is sufficient for the budget.
            // For adding ads to ad sets or ad sets to campaigns no new budget is spent so we ignore this check.
            if (this.parent.campaignId) {
              // Do nothing - no new budget will be spent so we can ignore the users balance
            } else if (
              !invalidCampaignDuration &&
              requiredBalance > this.parent.campaignAdCreditBalanceMicro
            ) {
              return createError({
                message: `${MicroUsdToUsdStringRoundedUp(
                  requiredBalance - this.parent.campaignAdCreditBalanceMicro,
                )} Ad Credit needed to support this budget`,
              });
            }
            // skip checking maximum budget
            return true;
          }

          const campaignMaxLifetimeBudgetUsd = durationInDays * dailyMaxBudgetUsd;
          if (!invalidCampaignDuration && val > campaignMaxLifetimeBudgetUsd) {
            return createError({
              message: `Maximum lifetime budget is ${campaignMaxLifetimeBudgetUsd.toFixed(
                2,
              )}  ${getEndUserDisplayCurrency(this.parent.campaignPaymentMethod)}`,
            });
          }
        }

        if (this.parent.campaignBudgetType === BudgetType.DAILY) {
          if (val < campaignMinimumDailyBudgetUsd) {
            return createError({
              message: `Minimum daily budget is ${campaignMinimumDailyBudgetUsd.toFixed(
                2,
              )} ${getEndUserDisplayCurrency(this.parent.campaignPaymentMethod)}`,
            });
          }
          // Skip checking maximum budget if it's managed or internal account.
          if (isAdAccountManaged || isAdAccountInternal) {
            return true;
          }

          if (this.parent.campaignPaymentMethod === PaymentMethodType.AD_CREDIT) {
            // will let date time picker handle the error if start time is
            // before end time, this will avoid showing wrong calculation
            if (this.parent.campaignStartTimestampMs >= this.parent.campaignEndTimestampMs) {
              return true;
            }

            const requiredBalance = usdToMicroUsd(val);

            if (requiredBalance > this.parent.campaignAdCreditBalanceMicro) {
              return createError({
                message: `${MicroUsdToUsdStringRoundedUp(
                  requiredBalance - this.parent.campaignAdCreditBalanceMicro,
                )} Ad Credit needed to support this budget`,
              });
            }

            // skip checking maximum budget
            return true;
          }

          if (val > dailyMaxBudgetUsd) {
            return createError({
              message: `Maximum daily budget is ${dailyMaxBudgetUsd.toFixed(
                2,
              )} ${getEndUserDisplayCurrency(this.parent.campaignPaymentMethod)}`,
            });
          }
        }

        return true;
      }),
    [campaignEndDate.name]: Yup.string()
      .nullable()
      .test('campaignEndDate-error', '', function (val, { createError }) {
        if (!this.parent.campaignHasEndDate) {
          return true;
        }

        const currentHHMMSS = new Date(this.parent.campaignEndTime || '');

        if (val === null || val === undefined) {
          return createError({
            message: 'Valid End Date Required',
          });
        }

        const newDate = new Date(val);

        const newlyDesiredDateTime = new Date(
          newDate.getFullYear(),
          newDate.getMonth(),
          newDate.getDate(),
          currentHHMMSS.getHours(),
          currentHHMMSS.getMinutes(),
        );

        const newEndDateInMs = newlyDesiredDateTime.getTime();
        const startDateInMs = new Date(this.parent.campaignStartTimestampMs).getTime();

        if (newEndDateInMs - startDateInMs < msInADay) {
          return createError({
            message: 'End date needs to be at least 24 hours after the start date',
          });
        }

        if (
          this.parent.campaignFormOpenedTime &&
          newEndDateInMs < this.parent.campaignFormOpenedTime
        ) {
          return createError({
            message: 'End date cannot be in the past',
          });
        }

        if (
          this.parent.campaignFormOpenedTime &&
          newEndDateInMs < this.parent.campaignFormOpenedTime + msInTwoHours
        ) {
          return createError({
            message: 'End date must be at least 2 hours in the future',
          });
        }

        return true;
      }),
    [campaignEndTime.name]: Yup.string()
      .nullable()
      .test('campaignEndTime-error', '', function (val, { createError }) {
        if (!this.parent.campaignHasEndDate) {
          return true;
        }

        if (val === null || val === undefined) {
          return createError({
            message: 'Required',
          });
        }

        const currentEndDay = new Date(this.parent.campaignEndDate || '');

        // By default this attr starts as a stringified unix timestamp.
        // After editing it's a string in this format: "Wed Oct 25 2023 21:54:00 GMT-0700 (Pacific Daylight Time)"
        let newTime;
        if (val?.length === 13) {
          // Unix timestamp string in ms
          newTime = new Date(Number.parseInt(val, 10));
        } else {
          newTime = new Date(val);
        }

        if (Number.isNaN(newTime.getTime())) {
          return createError({
            message: 'Invalid Time',
          });
        }

        const newlyDesiredDateTime = new Date(
          currentEndDay.getFullYear(),
          currentEndDay.getMonth(),
          currentEndDay.getDate(),
          newTime.getHours(),
          newTime.getMinutes(),
        );

        const newEndDateInMs = newlyDesiredDateTime.getTime();
        const startDateInMs = new Date(this.parent.campaignStartTimestampMs).getTime();

        if (newEndDateInMs - startDateInMs < msInADay) {
          return createError({
            message: 'End time needs to be at least 24 hours after the start time',
          });
        }

        if (
          this.parent.campaignFormOpenedTime &&
          newEndDateInMs < this.parent.campaignFormOpenedTime + msInTwoHours
        ) {
          return createError({
            message: 'End time must be at least 2 hours in the future',
          });
        }

        return true;
      }),
    [campaignName.name]: Yup.string()
      .max(128, 'Name must be 128 characters or less')
      .required(`${campaignName.requiredErrorMsg}`)
      // @ts-ignore
      .test(...noBlankInputTestParams)
      // @ts-ignore
      .test(...noSpecialCharactersTestParam),
    [campaignObjective.name]: Yup.string().required(`${campaignObjective.requiredErrorMsg}`),
    [campaignStartDate.name]: Yup.string()
      .nullable()
      .test('campaignStartDate-error', '', function (val, { createError }) {
        let currentHHMMSS;

        if (this.parent.campaignStartTime?.length === 13) {
          // Unix timestamp string in ms
          currentHHMMSS = new Date(Number.parseInt(this.parent.campaignStartTime, 10));
        } else {
          currentHHMMSS = new Date(this.parent.campaignStartTime || '');
        }

        if (val === null || val === undefined) {
          return createError({
            message: 'Valid Start Date Required',
          });
        }

        const newDate = new Date(val);

        const newlyDesiredDateTime = new Date(
          newDate.getFullYear(),
          newDate.getMonth(),
          newDate.getDate(),
          currentHHMMSS.getHours(),
          currentHHMMSS.getMinutes(),
        );

        const newStartDateInMs = newlyDesiredDateTime.getTime();

        if (this.parent.campaignEndDate !== null && this.parent.campaignEndDate !== undefined) {
          if (!this.parent.campaignHasEndDate) {
            return true;
          }
          const endDateInMs = new Date(this.parent.campaignEndTimestampMs).getTime();
          if (endDateInMs - newStartDateInMs < msInADay) {
            return createError({
              message: 'Start date needs to be at least 24 hours before the end date',
            });
          }
        }

        if (
          this.parent.campaignFormOpenedTime &&
          newStartDateInMs < this.parent.campaignFormOpenedTime
        ) {
          return createError({
            message: 'Start date cannot be in the past',
          });
        }

        return true;
      }),
    [campaignStartTime.name]: Yup.string()
      .nullable()
      .test('campaignStartTime-error', '', function (val, { createError }) {
        const currentStartDay = new Date(this.parent.campaignStartDate || '');

        if (val === null || val === undefined) {
          return createError({
            message: 'Required',
          });
        }

        // By default this attr starts as a stringified unix timestamp.
        // After editing it's a string in this format: "Wed Oct 25 2023 21:54:00 GMT-0700 (Pacific Daylight Time)"
        let newTime;
        if (val?.length === 13) {
          // Unix timestamp string in ms
          newTime = new Date(Number.parseInt(val, 10));
        } else {
          newTime = new Date(val);
        }

        if (Number.isNaN(newTime.getTime())) {
          return createError({
            message: 'Invalid Time',
          });
        }

        const newlyDesiredDateTime = new Date(
          currentStartDay.getFullYear(),
          currentStartDay.getMonth(),
          currentStartDay.getDate(),
          newTime.getHours(),
          newTime.getMinutes(),
        );

        const newStartDateInMs = newlyDesiredDateTime.getTime();

        if (this.parent.campaignEndDate !== null && this.parent.campaignEndDate !== undefined) {
          if (!this.parent.campaignHasEndDate) {
            return true;
          }

          const endDateInMs = new Date(this.parent.campaignEndTimestampMs).getTime();

          if (endDateInMs - newStartDateInMs < msInADay) {
            return createError({
              message: 'Start time needs to be at least 24 hours before the end time',
            });
          }
        }

        if (
          this.parent.campaignFormOpenedTime &&
          newStartDateInMs < this.parent.campaignFormOpenedTime
        ) {
          return createError({
            message: 'Start time cannot be in the past',
          });
        }

        return true;
      }),
  };
}

// TODO: find a better way to validate old and new targeting
function getTargetingAudienceValidation() {
  const commonTargeting = {
    [adSetAgeBucketTargeting.name]: Yup.object()
      .required(`${adSetAgeBucketTargeting.requiredErrorMsg}`)
      .test(
        'age-bucket-targeting-len-min',
        'Please select at least 1 age group to target',
        function (val) {
          if (val === undefined) {
            return false;
          }
          return val.ageBuckets && val.ageBuckets['length'] >= 1;
        },
      ),
    [adSetDeviceTargeting.name]: Yup.object()
      .required(`${adSetDeviceTargeting.requiredErrorMsg}`)
      .test(
        'device-targeting-len',
        'Please select at least 1 device platform to target',
        function (val) {
          if (val === undefined) {
            return false;
          }
          return val.devices && val.devices['length'] >= 1;
        },
      ),
    [adSetGenderTargeting.name]: Yup.object()
      .required(`${adSetDeviceTargeting.requiredErrorMsg}`)
      .test('gender-targeting-len', 'Please select at least 1 gender to target', function (val) {
        if (val === undefined) {
          return false;
        }
        return val.gender && val.gender !== Gender.GENDER_UNDEFINED_INVALID;
      }),
    [adSetLanguageTargeting.name]: Yup.object()
      .required(`${adSetLanguageTargeting.requiredErrorMsg}`)
      .test(
        'language-targeting-len',
        'Cannot exceed 10 selections - we recommend selecting All Languages',
        function (val) {
          if (val === undefined) {
            return false;
          }
          return val.languages && val.languages['length'] <= 10;
        },
      )
      .test('language-targeting-len-min', 'Please select at least 1 language', function (val) {
        if (val === undefined) {
          return false;
        }
        return val.languages && val.languages['length'] >= 1;
      }),
    [adSetMixedRegionAndCountryTargeting.name]: Yup.object()
      .required(`${adSetMixedRegionAndCountryTargeting.requiredErrorMsg}`)
      .test(
        'location-targeting-len-min',
        'You must make at least one selection to create campaign.',
        function (val) {
          if (val === undefined) {
            return false;
          }
          return (
            (val.regions && val.regions['length'] >= 1) ||
            (val.countries && val.countries['length'] >= 1)
          );
        },
      )
      .test('location-targeting-len-max', 'Please select at most 15 locations', function (val) {
        if (val === undefined) {
          return false;
        }
        const region_counts = val?.regions['length'] || 0;
        let country_counts = 0;
        // if country level targeting is not enabled, we will use region
        // targeting and countries will be empty
        if (val?.countries) {
          country_counts = val?.countries['length'];
        }
        return region_counts + country_counts <= 15;
      }),
  };

  return {
    ...commonTargeting,
    [adSetGenreTargeting.name]: Yup.object()
      .required(`${adSetGenreTargeting.requiredErrorMsg}`)
      .test('genre-targeting-len-min', adSetGenreTargeting.requiredErrorMsg, (val) => {
        if (val === undefined) {
          return false;
        }
        return val.genres && val.genres['length'] >= 1;
      }),
  };
}

function getExperienceTypeValidation(universesCanAccess: UniverseShapeType[]) {
  return Yup.boolean().test(
    'matching-universe-for-experience-types',
    '',
    function (_, { createError }) {
      if (universesCanAccess === undefined) {
        return true;
      }
      if (this.parent.campaignObjective !== CampaignObjectiveType.VISITS) {
        return true;
      }
      const matchingUniverses = universesCanAccess.filter(
        (universe: UniverseShapeType) =>
          universe.paid_access === this.parent.adSetPaidAccess &&
          universe.seventeen_plus_age_rating === this.parent.adSetRestrictedMaturity,
      );
      if (matchingUniverses.length === 0) {
        return createError({
          message:
            "You don't have experiences that are paid-access/free-access and restricted (18+)/not restricted (18+).",
        });
      }
      return true;
    },
  );
}

export function getFullCampaignValidationSchema(
  dailyMaxBudgetUsd: number,
  isAdAccountManaged: boolean,
  isAdAccountInternal: boolean,
  cpmMinimumBidUsd: number,
  cptMinimumBidUsd: number,
  tileAdsMinimumBidValueUsd: number,
  portalAdsMaximumBidValueUsd: number,
  tileAdsMaximumBidValueUsd: number,
  campaignMinimumDailyBudgetUsd: number,
  cpmMaximumBidUsd: number,
  cptMaximumBidUsd: number,
  coreRegionFloorPriceUsd: number,
  strategicRegionFloorPriceUsd: number,
  opportunisticRegionFloorPriceUsd: number,
  mixedRegionFloorPriceUsd: number,
  coreRegionCodeList: TODOFIXANY[],
  strategicRegionCodeList: TODOFIXANY[],
  opportunisticRegionCodeList: TODOFIXANY[],
  coreCountryOverrideCodeList: ServerCountryCode[],
  timeZone: string,
  cpcFloorPriceUsd: number,
  cpcCeilingPriceUsd: number,
  universesCanAccess: UniverseShapeType[],
  overrides?: TODOFIXANY,
) {
  return Yup.object().shape({
    ...getCampaignValidationSchemaBase(
      dailyMaxBudgetUsd,
      isAdAccountManaged,
      isAdAccountInternal,
      campaignMinimumDailyBudgetUsd,
      timeZone,
    ),
    [adName.name]: adNameValidation,
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
    [adSetFrequencyCapValue.name]: Yup.number()
      .typeError('You must specify a number')
      .test('min-max-frequency-cap', '', function (val, { createError }) {
        if (this.parent.adSetFrequencyCapOn === false) {
          return true;
        }
        if (val === undefined) {
          return createError({
            message: 'Frequency cap value is required',
          });
        }
        if (val < 1) {
          return createError({
            message: 'Frequency cap must be at least 1',
          });
        }
        if (val > 100) {
          return createError({
            message: 'Max allowed frequency cap is 100',
          });
        }

        return true;
      }),
    [adSetName.name]: adSetNameValidation,
    [adSetPaidAccess.name]: getExperienceTypeValidation(universesCanAccess),
    [adSetRestrictedMaturity.name]: getExperienceTypeValidation(universesCanAccess),
    ...getTargetingAudienceValidation(),
  });
}

const now = Date.now();

export const STATIC_DEFAULT_CAMPAIGN_DATA: Omit<
  CampaignBaseType,
  'id' | 'status' | 'budgetCapMicroUsd'
> = {
  budgetType: BudgetType.LIFETIME,
  campaignEndDate: now,
  campaignEndTime: now,
  campaignStartDate: now,
  campaignStartTime: now,
  name: `Visits - ${formatDateToMMDDYYYY(new Date(now))}`,
  objective: CampaignObjectiveType.VISITS,
  paymentMethodType: PaymentMethodType.CARD,
  startTimestampMs: now,
};

export const STATIC_DEFAULT_ADSET_DATA: Omit<
  AdSetCreationType,
  'id' | 'campaignId' | 'status' | 'bidValueMicroUsd' | 'targetingRelations' | 'auctionType'
> & { targetingRelations: TODOFIXANY } = {
  bidType: AdSetBidType.FIXED_COST_PER_MILLE,
  brandSuitabilityType: AdSetBrandSuitabilityType.UNIVERSE_SUITABILITY_FILTER_SELECT,
  frequencyCappingRules: [],
  // When we reenable languages we will add this back to the default
  // name: 'All Countries, All Languages, All Genders, All Ages',
  name: 'All Regions, All Genders, All Ages',
  startTimestampMs: now,
  targetingRelations: {
    adSetMixedRegionAndCountryTargeting: { countries: [], regions: [regions[0]] },
    adSetMixedRegionAndCountryTargetingSearchTerm: '',
    ageBucketCriteria: {
      ageBuckets: [
        ...ageBuckets.map((ageBucketObj: TODOFIXANY) => {
          return ageBucketObj.value;
        }),
      ],
    },
    ageCriteria: {
      lowerBound: allMinAges[0].value,
      upperBound: allMaxAges[allMaxAges.length - 1].value,
    },
    deviceCriteria: {
      devices: [
        ...devices.map((deviceObj: TODOFIXANY) => {
          return deviceObj.value;
        }),
      ],
    },
    genderCriteria: { gender: Gender.GENDER_ANY },
    genreCriteria: { genres: [AllGenresObj] },
    languageCriteria: { languages: [languages[0]] },
  },
};

const DEFAULT_FREQUENCY_CAP_VALUE = 3;

const DEFAULT_DISPLAY_AD_META_DATA = {
  assetId: '',
  assetType: AssetType.IMAGE,
  height: 0,
  width: 0,
};

const DEFAULT_AD_DATA: Omit<AdCreationType, 'campaignId' | 'status' | 'adSetId'> = {
  adType: AdFormatType.DISPLAY,
  metaData: DEFAULT_DISPLAY_AD_META_DATA,
  name: 'My Ad',
};

export const getEndUserDisplayAge = (ageVal: number) => {
  const foundAgeObj = allMaxAges.find((ageObj) => {
    return ageObj.value === ageVal;
  });

  return (foundAgeObj && foundAgeObj.title) || ageVal;
};

export const getEndUserDisplayGender = (genderVal: string) => {
  let textToReturn;

  switch (genderVal) {
    case Gender.GENDER_ANY:
      textToReturn = 'All';
      break;
    case Gender.GENDER_FEMALE:
      textToReturn = 'Female';
      break;
    case Gender.GENDER_MALE:
      textToReturn = 'Male';
      break;
    default:
  }

  return textToReturn || '';
};

export const getEndUserDisplayAgeBucket = (ageBucketVal: string) => {
  switch (ageBucketVal) {
    case AgeBucketType.AGE_BUCKET_TYPE_5_TO_12:
      return '5-12';
    case AgeBucketType.AGE_BUCKET_TYPE_13_TO_17:
      return '13-17';
    case AgeBucketType.AGE_BUCKET_TYPE_18_TO_24:
      return '18-24';
    case AgeBucketType.AGE_BUCKET_TYPE_25_PLUS:
      return '25+';
    default:
      return '';
  }
};

export const getEndUserDisplayDevice = (deviceVal: string[]) => {
  if (deviceVal.includes(DeviceType.DEVICE_TYPE_ALL)) {
    return 'All';
  }

  const textToReturn: string[] = [];
  Object.values(deviceVal).forEach((type) => {
    if (type === DeviceType.DEVICE_TYPE_COMPUTER) {
      textToReturn.push('Desktop');
    }
    if (type === DeviceType.DEVICE_TYPE_CONSOLE) {
      textToReturn.push('Console');
    }
    if (type === DeviceType.DEVICE_TYPE_TABLET) {
      textToReturn.push('Tablet');
    }
    if (type === DeviceType.DEVICE_TYPE_PHONE) {
      textToReturn.push('Mobile');
    }
  });

  return textToReturn.join(', ');
};

export const getEndUserDisplayCampaignBudgetType = (campaignBudgetTypeVal: string) => {
  let textToReturn;
  switch (campaignBudgetTypeVal) {
    case BudgetType.DAILY:
      textToReturn = 'Daily Budget';
      break;
    case BudgetType.LIFETIME:
      textToReturn = 'Lifetime Budget';
      break;
    default:
  }

  return textToReturn || '';
};

export const getEndUserDisplayAdType = (adTypeVal: string) => {
  let textToReturn;
  switch (adTypeVal) {
    case AdFormatType.DISPLAY:
      textToReturn = 'Image';
      break;
    case AdFormatType.PORTAL:
      textToReturn = 'Portal';
      break;
    case AdFormatType.TILE:
      textToReturn = 'Tile';
      break;
    case AdFormatType.VIDEO:
      textToReturn = 'Video';
      break;
    case AdFormatType.SEARCH:
      textToReturn = 'Search';
      break;
    default:
  }

  return textToReturn || '';
};

export const getEndUserDisplayAdPlacement = (adPlacementVal: string) => {
  let textToReturn;
  switch (adPlacementVal) {
    case AdFormatType.PORTAL:
      textToReturn = 'In-Experience Portal';
      break;
    case AdFormatType.TILE:
      textToReturn = 'Sponsored Experience';
      break;
    case AdFormatType.DISPLAY:
      textToReturn = 'In-Experience Image';
      break;
    case AdFormatType.VIDEO:
      textToReturn = 'In-Experience Video';
      break;
    case AdFormatType.SEARCH:
      textToReturn = 'Search Experience';
      break;
    default:
  }

  return textToReturn || '';
};

export const getEndUserDisplayBrandSuitabilityType = (suitabilityType: string) => {
  let textToReturn;
  switch (suitabilityType) {
    case AdSetBrandSuitabilityType.UNIVERSE_SUITABILITY_FILTER_FULL:
      textToReturn = 'Full Inventory';
      break;
    case AdSetBrandSuitabilityType.UNIVERSE_SUITABILITY_FILTER_STANDARD:
      textToReturn = 'Standard Inventory';
      break;
    case AdSetBrandSuitabilityType.UNIVERSE_SUITABILITY_FILTER_LIMITED:
      textToReturn = 'Limited Inventory';
      break;
    case AdSetBrandSuitabilityType.UNIVERSE_SUITABILITY_FILTER_SELECT:
      textToReturn = 'Advertiser Select Inventory';
      break;
    default:
  }

  return textToReturn || '';
};

export const getEndUserDisplayPaymentMethod = (paymentMethodVal: string) => {
  let textToReturn;
  switch (paymentMethodVal) {
    case PaymentMethodType.CARD:
      textToReturn = 'Card';
      break;
    case PaymentMethodType.AD_CREDIT:
      textToReturn = 'Ad Credit';
      break;
    case PaymentMethodType.INVOICE:
      textToReturn = 'Line of Credit';
      break;
    default:
  }

  return textToReturn || '';
};

export const getEndUserBidInfoDisplay = (givenAdSetBidType: string, paymentMethod: string) => {
  let textToReturn;
  switch (givenAdSetBidType) {
    case AdSetBidType.FIXED_COST_PER_MILLE:
    case AdSetBidType.COST_PER_MILLE:
      textToReturn = `${getEndUserDisplayCurrency(paymentMethod)}/Thousand Impressions (CPM)`;
      break;
    case AdSetBidType.FIXED_COST_PER_TELEPORT:
      textToReturn = `Cost Per Play (${getEndUserDisplayCurrency(paymentMethod)})`;
      break;
    case AdSetBidType.CPV15:
      textToReturn = `${getEndUserDisplayCurrency(paymentMethod)}/15-Sec View (CPV15)`;
      break;
    case AdSetBidType.COST_PER_CLICK:
      textToReturn = `Cost Per Click (${getEndUserDisplayCurrency(paymentMethod)})`;
      break;
    default:
  }

  return textToReturn || '';
};

export interface CreateCampaignWizardInitialValuesType {
  adAssetHeight: number;
  adAssetId: string;
  adAssetWidth: number;
  adDestinationUniverseId: string;
  adName: string;
  adPortalDestinationPlaceId: string;
  adPortalDestinationText: string;
  adSetAgeBucketTargeting: AgeBucketCriteria;
  adSetAgeTargeting: AgeCriteria;
  adSetAuctionType: AdSetAuctionType;
  adSetBidType: AdSetBidType;
  adSetBidValueUsd?: number;
  adSetBrandSuitabilityType: string;
  adSetDeviceTargeting: DeviceCriteria;
  adSetFrequencyCapOn: boolean;
  adSetFrequencyCapValue: number;
  adSetGenderTargeting: GenderCriteria;
  adSetGenreTargeting: GenreCriteria;
  adSetId: string;
  adSetLanguageTargeting: LanguageCriteria;
  adSetMixedRegionAndCountryTargeting: MixedRegionAndCountryCriteria;
  adSetMixedRegionAndCountryTargetingSearchTerm?: string;
  adSetName: string;
  adSetPaidAccess: boolean;
  adSetPlacementType: string;
  adSetRestrictedMaturity: boolean;
  adSetSpecialExperienceSelectionToggledOn: boolean;
  adType: AdFormatType;
  adVideoAssetId: string;
  campaignAdvertiserName: string;
  campaignAdvertiserNameError: string;
  campaignBudgetCapUsd: number;
  campaignBudgetType: BudgetType;
  campaignEndDate: number;
  campaignEndTime: number;
  campaignEndTimestampMs: number;
  campaignId: string;
  campaignName: string;
  campaignObjective: CampaignObjectiveType;
  campaignPaymentMethod: PaymentMethodType;
  campaignStartDate: number;
  campaignStartTime: number;
  campaignStartTimestampMs: number;
  compositeReviewDecision?: number | null;
}

const createCampaignWizardStaticInitialValues: Partial<CreateCampaignWizardInitialValuesType> = {
  [adAssetHeight.name]: 0,
  [adAssetId.name]: '',
  [adAssetWidth.name]: 0,
  [adDestinationUniverseId.name]: '',
  [adName.name]: DEFAULT_AD_DATA.name,
  [adPortalDestinationPlaceId.name]: '',
  [adPortalDestinationText.name]: '',
  [adSetAgeBucketTargeting.name]: STATIC_DEFAULT_ADSET_DATA.targetingRelations.ageBucketCriteria,
  [adSetAgeTargeting.name]: STATIC_DEFAULT_ADSET_DATA.targetingRelations.ageCriteria,
  [adSetBidType.name]: STATIC_DEFAULT_ADSET_DATA.bidType,
  [adSetBrandSuitabilityType.name]: STATIC_DEFAULT_ADSET_DATA.brandSuitabilityType,
  [adSetDeviceTargeting.name]: STATIC_DEFAULT_ADSET_DATA.targetingRelations.deviceCriteria,
  [adSetFrequencyCapOn.name]: false,
  [adSetFrequencyCapValue.name]: DEFAULT_FREQUENCY_CAP_VALUE,
  [adSetGenderTargeting.name]: STATIC_DEFAULT_ADSET_DATA.targetingRelations.genderCriteria,
  [adSetGenreTargeting.name]: STATIC_DEFAULT_ADSET_DATA.targetingRelations.genreCriteria,
  [adSetId.name]: '',
  [adSetLanguageTargeting.name]: STATIC_DEFAULT_ADSET_DATA.targetingRelations.languageCriteria,
  [adSetMixedRegionAndCountryTargeting.name]:
    STATIC_DEFAULT_ADSET_DATA.targetingRelations.adSetMixedRegionAndCountryTargeting,
  [adSetMixedRegionAndCountryTargetingSearchTerm.name]:
    STATIC_DEFAULT_ADSET_DATA.targetingRelations.adSetMixedRegionAndCountryTargetingSearchTerm,
  [adSetName.name]: STATIC_DEFAULT_ADSET_DATA.name,
  [adSetPaidAccess.name]: false,
  [adSetRestrictedMaturity.name]: false,
  [adSetSpecialExperienceSelectionToggledOn.name]: false,
  [adType.name]: DEFAULT_AD_DATA.adType,
  [adVideoAssetId.name]: '',
  [campaignAdvertiserName.name]: '',
  [campaignAdvertiserNameError.name]: '',
  [campaignBudgetType.name]: STATIC_DEFAULT_CAMPAIGN_DATA.budgetType,
  [campaignEndDate.name]: STATIC_DEFAULT_CAMPAIGN_DATA.campaignEndDate,
  [campaignEndTime.name]: STATIC_DEFAULT_CAMPAIGN_DATA.campaignEndTime,
  [campaignEndTimestampMs.name]: STATIC_DEFAULT_CAMPAIGN_DATA.endTimestampMs,
  [campaignId.name]: '',
  [campaignName.name]: STATIC_DEFAULT_CAMPAIGN_DATA.name,
  [campaignObjective.name]: STATIC_DEFAULT_CAMPAIGN_DATA.objective,
  [campaignPaymentMethod.name]: STATIC_DEFAULT_CAMPAIGN_DATA.paymentMethodType,
  [campaignStartDate.name]: STATIC_DEFAULT_CAMPAIGN_DATA.campaignStartDate,
  [campaignStartTime.name]: STATIC_DEFAULT_CAMPAIGN_DATA.campaignStartTime,
  [campaignStartTimestampMs.name]: STATIC_DEFAULT_CAMPAIGN_DATA.startTimestampMs,
  [compositeReviewDecision.name]: ServerAdAssetCompositeReviewDecisionType.PENDING_REVIEW,
};

/**
 * Default bid value is decided by AdFormat, AccountType, and MarketType
 * Rules are defined in this doc:
 * https://roblox.atlassian.net/wiki/spaces/ADS/pages/2222523551/Ads+Platform+Second+Price+New+Floor+Price+Product+Spec
 */
export const getDefaultBidValue = (
  newAdSetBidType: AdSetBidType,
  newAdSetAuctionType: AdSetAuctionType,
  newAdSetAdType: AdFormatType,
  targetedRegions: ServerRegionCode[],
  targetedCountries: TODOFIXANY[], // Countries Object
  coreRegionCodeList: ServerRegionCode[],
  strategicRegionCodeList: ServerRegionCode[],
  coreCountryOverrideCodeList: ServerCountryCode[],
  overrides: TODOFIXANY = {},
) => {
  const newServerAdSetBidType = mapBidTypeFormikToServer(newAdSetBidType);
  let defaultBidValue = 2.0;
  const regionType = getTargetRegionMarketType(
    targetedRegions,
    coreRegionCodeList,
    strategicRegionCodeList,
    coreCountryOverrideCodeList,
    targetedCountries,
  );

  const videoBidFloors = overrides.videoMinBidMappingsMicroUsd || {};

  if (newServerAdSetBidType === ServerAdSetBidType.CPM) {
    if (newAdSetAdType === AdFormatType.VIDEO) {
      if (regionType === MarketType.CORE) {
        return (
          (videoBidFloors.coreRegionVideoCpmFloorPriceMicroUsd &&
            microUsdToUsd(videoBidFloors.coreRegionVideoCpmFloorPriceMicroUsd)) ||
          5.0
        );
      }
      if (regionType === MarketType.MIXED) {
        return (
          (videoBidFloors.mixedRegionVideoCpmFloorPriceMicroUsd &&
            microUsdToUsd(videoBidFloors.mixedRegionVideoCpmFloorPriceMicroUsd)) ||
          4.0
        );
      }
      return (
        (videoBidFloors.strategicRegionVideoCpmFloorPriceMicroUsd &&
          microUsdToUsd(videoBidFloors.strategicRegionVideoCpmFloorPriceMicroUsd)) ||
        2.0
      );
    }
    return (
      (videoBidFloors.opportunisticRegionVideoCpmFloorPriceMicroUsd &&
        microUsdToUsd(videoBidFloors.opportunisticRegionVideoCpmFloorPriceMicroUsd)) ||
      2.0
    );
  }

  if (newServerAdSetBidType === ServerAdSetBidType.CPV15) {
    if (regionType === MarketType.CORE) {
      return (
        (videoBidFloors.coreRegionVideoCpv15FloorPriceMicroUsd &&
          microUsdToUsd(videoBidFloors.coreRegionVideoCpv15FloorPriceMicroUsd)) ||
        0.2
      );
    }
    if (regionType === MarketType.MIXED) {
      return (
        (videoBidFloors.mixedRegionVideoCpv15FloorPriceMicroUsd &&
          microUsdToUsd(videoBidFloors.mixedRegionVideoCpv15FloorPriceMicroUsd)) ||
        0.2
      );
    }

    if (regionType === MarketType.STRATEGIC) {
      return (
        (videoBidFloors.strategicRegionVideoCpv15FloorPriceMicroUsd &&
          microUsdToUsd(videoBidFloors.strategicRegionVideoCpv15FloorPriceMicroUsd)) ||
        0.1
      );
    }
    return (
      (videoBidFloors.opportunisticRegionVideoCpv15FloorPriceMicroUsd &&
        microUsdToUsd(videoBidFloors.opportunisticRegionVideoCpv15FloorPriceMicroUsd)) ||
      0.1
    );
  }

  if (newServerAdSetBidType === ServerAdSetBidType.CPT) {
    defaultBidValue = 0.2;
    if (newAdSetAdType === AdFormatType.PORTAL) {
      // portal ads is same for managed and self-serve accounts
      if (regionType === MarketType.CORE) {
        defaultBidValue = 0.2;
      } else {
        // default 0.1 for portal ads non-core regions
        defaultBidValue = 0.1;
      }
    }
    if (newAdSetAdType === AdFormatType.TILE) {
      if (newAdSetAuctionType === AdSetAuctionType.AUCTION_TYPE_SECOND_PRICE) {
        // second price, sponsored ads always 0.05
        defaultBidValue = 0.05;
      } else if (regionType === MarketType.CORE) {
        // first price, sponsored ads core regions 0.2
        defaultBidValue = 0.2;
      } else {
        // first price, sponsored ads non-core regions 0.1
        defaultBidValue = 0.1;
      }
    }
  }

  if (newServerAdSetBidType === ServerAdSetBidType.CPC) {
    defaultBidValue = 0.01;
  }
  // This should not be possible, but if so, return the largest default bid value to
  // prevent accidentally using a bid value that is under the minimum.
  return defaultBidValue;
};

const getDefaultPaymentMethod = (
  isAccountManagedOrInternal: boolean,
  hasPaymentProfile: boolean,
  adCreditActivated: boolean,
) => {
  if (isAccountManagedOrInternal) {
    return PaymentMethodType.INVOICE;
  }
  if (!hasPaymentProfile && adCreditActivated) {
    return PaymentMethodType.AD_CREDIT;
  }
  return PaymentMethodType.CARD;
};

export function getCreateCampaignWizardInitialValues(
  isAdAccountInternal: boolean,
  isAdAccountManaged: boolean,
  campaignMinimumDailyBudgetUsd: number,
  hasPaymentProfile: boolean,
  adCreditActivated: boolean,
  organizationInfo: TODOFIXANY,
): Partial<CreateCampaignWizardInitialValuesType> {
  const initialValues = createCampaignWizardStaticInitialValues;

  initialValues.adSetAuctionType =
    isAdAccountManaged || isAdAccountInternal
      ? AdSetAuctionType.AUCTION_TYPE_FIRST_PRICE
      : AdSetAuctionType.AUCTION_TYPE_SECOND_PRICE;

  initialValues.campaignBudgetCapUsd =
    initialValues.campaignBudgetType === BudgetType.LIFETIME
      ? campaignMinimumDailyBudgetUsd * 4
      : campaignMinimumDailyBudgetUsd;

  initialValues.adSetName = 'All Regions, All Genders, All Ages';

  initialValues.campaignPaymentMethod = getDefaultPaymentMethod(
    isAdAccountManaged || isAdAccountInternal,
    hasPaymentProfile,
    adCreditActivated,
  );

  if (organizationInfo?.type === OrganizationType.ORGANIZATION_TYPE_BUSINESS) {
    initialValues.campaignAdvertiserName = organizationInfo?.business_name?.name || '';
  }

  if (initialValues.campaignObjective === CampaignObjectiveType.VISITS) {
    initialValues.adType = AdFormatType.PORTAL;
  }

  return initialValues;
}
