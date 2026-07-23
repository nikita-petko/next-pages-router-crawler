import Big from 'big.js';
import { cloneDeep, filter, size, toInteger } from 'lodash';

import { ServerAdType } from '@constants/ad';
import { ServerAdSetBrandSuitabilityType } from '@constants/adSet';
import { DeviceType, ServerAgeBucketType, ServerGenderType } from '@constants/advancedTargeting';
import { AdAccountTypeFromModel } from '@constants/advertiser';
import { ServerCampaignObjectiveType, ServerPaymentType } from '@constants/campaign';
import { CampaignObjectiveType } from '@constants/campaignBuilder';
import { UNAVAILABLE_VALUE_DISPLAY } from '@constants/displayConstants';
import { CreateAdAccountRequest, UpdateAdvertiserRequest } from '@modules/clients/ads/adsClient';
import * as AdsClientTypes from '@modules/clients/ads/adsClientTypes';
import { AdFormatType, ServerGetAdRowResponse } from '@type/ad';
import {
  AdSetAuctionType,
  AdSetBidType,
  AdSetBrandSuitabilityType,
  ServerAdSetAuctionType,
  ServerAdSetBidType,
  ServerGetAdSetRowResponse,
} from '@type/adSet';
import {
  GetAdSetStatusResponseType,
  GetAdStatusResponseType,
  GetCampaignStatusResponseType,
  ServerGetCampaignRowResponse,
} from '@type/campaign';
import { ToFixedNoRounding } from '@utils/currency';
import { GetTimezoneOffsetMs } from '@utils/date';
import {
  ageBuckets,
  AllGenresObj,
  getCountryFromLocationCode,
  getGenreStringFromProtoVal,
  getLanguageFromLanguageCode,
  getMixedRegionCountryObjFromCountryCode,
  getRegionFromLocationCode,
  RegionsAndLocationsFormInputObj,
  u13AgeBucket,
} from 'app/shared/formDefaults';
import { TODOFIXANY } from 'app/shared/types';

export const MICRO_USD_IN_USD = 1000000;

export const roundFloatDownToTwoDecimals = (floatNum: number) => {
  return Math.floor(floatNum * 100) / 100;
};

export const microUsdToUsd = (microUsdAmt: number) => {
  const usdAmt = microUsdAmt / MICRO_USD_IN_USD;
  return ToFixedNoRounding(usdAmt, 2);
};

export const usdToMicroUsd = (usdAmt: number) => {
  const amt = new Big(usdAmt.toString());
  const ratio = new Big(MICRO_USD_IN_USD);
  return toInteger(amt.times(ratio));
};

// https://github.rbx.com/Roblox/ads/blob/4e16d8de0e3b748c8a16539100c19d4fa2260e20/services/ads-management-service-v2/internal/implementations/ad_test.go#L284

export const getCampaignObjectiveDisplayText = (objective: ServerCampaignObjectiveType) => {
  switch (objective) {
    case ServerCampaignObjectiveType.AWARENESS:
      return 'Awareness';
    case ServerCampaignObjectiveType.VISITS:
      return 'Visits';
    case ServerCampaignObjectiveType.VIDEO_VIEWS:
      return 'Video Views';
    default:
      // TODO: Should never hit this case - if we do there's an issue and we should log
      return '';
  }
};

const getEndUserCampaignObjectiveText = (campaignRow: ServerGetCampaignRowResponse) => {
  return getCampaignObjectiveDisplayText(campaignRow.objective as ServerCampaignObjectiveType);
};

const getEndUserCampaignBudgetInfo = (campaignRow: ServerGetCampaignRowResponse) => {
  const { budget: budgetObj } = campaignRow;
  const { daily_budget_micro_usd = 0, lifetime_budget_micro_usd = 0 } = budgetObj;
  const budgetUsd = microUsdToUsd(daily_budget_micro_usd || lifetime_budget_micro_usd);
  const budgetTypeEndUserText = daily_budget_micro_usd ? 'Daily' : 'Lifetime';

  return { budgetTypeEndUserText, budgetUsd };
};

const getEndUserAdSetBidInfo = (adSetRow: ServerGetAdSetRowResponse) => {
  const { bidding_strategy: biddingInfo } = adSetRow;
  const { bid_type: bidType, bid_value_micro_usd: bidValueMicroUsd = 0 } = biddingInfo;
  const bidTypeText = (() => {
    let auctionTypeText = '';
    switch (adSetRow.auction_type) {
      case ServerAdSetAuctionType.AUCTION_TYPE_FIRST_PRICE:
        break;
      case ServerAdSetAuctionType.AUCTION_TYPE_FIRST_PRICE_PRIORITY:
        auctionTypeText = ' (Priority Bid)';
        break;
      default:
        break;
    }

    let adSetBidTypeText = '';
    switch (bidType) {
      case ServerAdSetBidType.CPM:
        adSetBidTypeText = 'CPM';
        break;
      case ServerAdSetBidType.CPV15:
        adSetBidTypeText = 'CPV15';
        break;
      case ServerAdSetBidType.CPC:
        adSetBidTypeText = 'CPC';
        break;
      default:
        adSetBidTypeText = 'CPP';
        break;
    }

    return `${adSetBidTypeText}${auctionTypeText}`;
  })();

  const maxBidUsd = microUsdToUsd(bidValueMicroUsd);
  return {
    bidTypeText,
    maxBidUsd,
  };
};

export const getAdSetBidTypeDisplayText = (bidType: ServerAdSetBidType) => {
  switch (bidType) {
    case ServerAdSetBidType.CPM:
      return 'CPM';
    case ServerAdSetBidType.CPV15:
      return 'CPV15';
    case ServerAdSetBidType.CPT:
      return 'CPP';
    case ServerAdSetBidType.CPC:
      return 'CPC';
    default:
      return '';
  }
};

const mapBrandSuitabilityTypeFormikToServer = (
  adSetBrandSuitabilityType: AdSetBrandSuitabilityType,
) => {
  switch (adSetBrandSuitabilityType) {
    case AdSetBrandSuitabilityType.UNIVERSE_SUITABILITY_FILTER_FULL:
      return ServerAdSetBrandSuitabilityType.UNIVERSE_SUITABILITY_FILTER_FULL;
    case AdSetBrandSuitabilityType.UNIVERSE_SUITABILITY_FILTER_LIMITED:
      return ServerAdSetBrandSuitabilityType.UNIVERSE_SUITABILITY_FILTER_LIMITED;
    case AdSetBrandSuitabilityType.UNIVERSE_SUITABILITY_FILTER_STANDARD:
      return ServerAdSetBrandSuitabilityType.UNIVERSE_SUITABILITY_FILTER_STANDARD;
    case AdSetBrandSuitabilityType.UNIVERSE_SUITABILITY_FILTER_SELECT:
      return ServerAdSetBrandSuitabilityType.UNIVERSE_SUITABILITY_FILTER_SELECT;
    default:
      return ServerAdSetBrandSuitabilityType.UNIVERSE_SUITABILITY_FILTER_UNSPECIFIED;
  }
};

export const mapServerBrandSuitabilityTypeToFormik = (
  adSetBrandSuitabilityType: ServerAdSetBrandSuitabilityType,
) => {
  switch (adSetBrandSuitabilityType) {
    case ServerAdSetBrandSuitabilityType.UNIVERSE_SUITABILITY_FILTER_FULL:
      return AdSetBrandSuitabilityType.UNIVERSE_SUITABILITY_FILTER_FULL;
    case ServerAdSetBrandSuitabilityType.UNIVERSE_SUITABILITY_FILTER_LIMITED:
      return AdSetBrandSuitabilityType.UNIVERSE_SUITABILITY_FILTER_LIMITED;
    case ServerAdSetBrandSuitabilityType.UNIVERSE_SUITABILITY_FILTER_STANDARD:
      return AdSetBrandSuitabilityType.UNIVERSE_SUITABILITY_FILTER_STANDARD;
    case ServerAdSetBrandSuitabilityType.UNIVERSE_SUITABILITY_FILTER_SELECT:
      return AdSetBrandSuitabilityType.UNIVERSE_SUITABILITY_FILTER_SELECT;
    default:
      return AdSetBrandSuitabilityType.UNIVERSE_SUITABILITY_FILTER_UNSPECIFIED;
  }
};

export const mapBidTypeFormikToServer = (adSetBidType: AdSetBidType) => {
  switch (adSetBidType) {
    case AdSetBidType.COST_PER_MILLE:
      return ServerAdSetBidType.CPM;
    case AdSetBidType.FIXED_COST_PER_MILLE:
      return ServerAdSetBidType.CPM;
    case AdSetBidType.FIXED_COST_PER_TELEPORT:
      return ServerAdSetBidType.CPT;
    case AdSetBidType.CPV15:
      return ServerAdSetBidType.CPV15;
    case AdSetBidType.COST_PER_CLICK:
      return ServerAdSetBidType.CPC;
    default:
      return ServerAdSetBidType.UNDEFINED;
  }
};

export const mapMiscBidTypeToServerBidType = (adSetBidType: TODOFIXANY) => {
  switch (adSetBidType) {
    case AdSetBidType.FIXED_COST_PER_MILLE:
      return ServerAdSetBidType.CPM;
    case AdSetBidType.FIXED_COST_PER_TELEPORT:
      return ServerAdSetBidType.CPT;
    case ServerAdSetBidType.CPM:
      return ServerAdSetBidType.CPM;
    case ServerAdSetBidType.CPT:
      return ServerAdSetBidType.CPT;
    case AdSetBidType.CPV15:
      return ServerAdSetBidType.CPV15;
    case AdSetBidType.COST_PER_CLICK:
      return ServerAdSetBidType.CPC;
    case ServerAdSetBidType.CPC:
      return ServerAdSetBidType.CPC;
    default:
      return AdSetBidType.UNDEFINED;
  }
};

export const mapMiscAdTypeToServerAdType = (adType: AdFormatType) => {
  switch (adType) {
    case AdFormatType.DISPLAY:
      return AdsClientTypes.ServerAdFormatType.DISPLAY;
    case AdFormatType.PORTAL:
      return AdsClientTypes.ServerAdFormatType.PORTAL;
    case AdFormatType.TILE:
      return AdsClientTypes.ServerAdFormatType.TILE;
    case AdFormatType.VIDEO:
      return AdsClientTypes.ServerAdFormatType.VIDEO;
    case AdFormatType.SEARCH:
      return AdsClientTypes.ServerAdFormatType.SEARCH;
    default:
      return AdsClientTypes.ServerAdFormatType.UNDEFINED;
  }
};

export const mapServerBidTypeToFormik = (adSetBidType: ServerAdSetBidType) => {
  switch (adSetBidType) {
    case ServerAdSetBidType.CPM:
      return AdSetBidType.FIXED_COST_PER_MILLE;
    case ServerAdSetBidType.CPT:
      return AdSetBidType.FIXED_COST_PER_TELEPORT;
    case ServerAdSetBidType.CPV15:
      return AdSetBidType.CPV15;
    case ServerAdSetBidType.CPC:
      return AdSetBidType.COST_PER_CLICK;
    default:
      return AdSetBidType.UNDEFINED;
  }
};

export const mapServerAdTypeToFormik = (adType: AdsClientTypes.ServerAdFormatType) => {
  switch (adType) {
    case AdsClientTypes.ServerAdFormatType.DISPLAY:
      return AdFormatType.DISPLAY;
    case AdsClientTypes.ServerAdFormatType.PORTAL:
      return AdFormatType.PORTAL;
    case AdsClientTypes.ServerAdFormatType.VIDEO:
      return AdFormatType.VIDEO;
    case AdsClientTypes.ServerAdFormatType.TILE:
      return AdFormatType.TILE;
    case AdsClientTypes.ServerAdFormatType.SEARCH:
      return AdFormatType.SEARCH;
    default:
      return AdFormatType.UNDEFINED;
  }
};

export const getAdSetFrequencyCapInfo = (adSetRow: TODOFIXANY) => {
  const frequencyCapOn = adSetRow.frequency_capping_rules?.length > 0;
  const capValue = frequencyCapOn ? adSetRow.frequency_capping_rules[0].value : 0;
  return { capValue, frequencyCapOn };
};

export const getAdStatusFormatDisplayText = (adType: ServerAdType) => {
  switch (adType) {
    case ServerAdType.DISPLAY:
      return 'In-Experience Image';
    case ServerAdType.PORTAL:
      return 'In-Experience Portal';
    case ServerAdType.VIDEO:
      return 'In-Experience Video';
    case ServerAdType.SPONSORED_UNIVERSE:
      return 'Sponsored Experience';
    case ServerAdType.SEARCH:
      return 'Search Experience';
    default:
      return '';
  }
};

const getEndUserAdStatusFormat = (adRow: ServerGetAdRowResponse) => {
  const { type: adType } = adRow;

  return getAdStatusFormatDisplayText(adType);
};

export const getFromServerCampaignObjective = (campaignRow: ServerGetCampaignRowResponse) => {
  switch (campaignRow.objective) {
    case ServerCampaignObjectiveType.AWARENESS:
      return CampaignObjectiveType.AWARENESS;
    case ServerCampaignObjectiveType.VISITS:
      return CampaignObjectiveType.VISITS;
    case ServerCampaignObjectiveType.VIDEO_VIEWS:
      return CampaignObjectiveType.VIDEO_VIEWS;
    default:
  }

  return '';
};

export const getFromServerCampaignBudgetInfo = (campaignRow: ServerGetCampaignRowResponse) => {
  const { budget: budgetObj } = campaignRow;
  const { daily_budget_micro_usd = 0, lifetime_budget_micro_usd = 0 } = budgetObj;
  const budgetUsd = microUsdToUsd(daily_budget_micro_usd || lifetime_budget_micro_usd);
  const budgetType = daily_budget_micro_usd
    ? AdsClientTypes.BudgetType.DAILY
    : AdsClientTypes.BudgetType.LIFETIME;

  return { budgetType, budgetUsd };
};

const getAllAdsUnderAdSet = (adSetRow: ServerGetAdSetRowResponse, allAds: TODOFIXANY = []) => {
  return allAds.filter((ad: TODOFIXANY) => {
    return ad.ad_set_id === adSetRow.id;
  });
};

export const getEndUserAdSetAuctionType = (adSetServerAuctionType: number) => {
  switch (adSetServerAuctionType) {
    case ServerAdSetAuctionType.AUCTION_TYPE_FIRST_PRICE:
      return AdSetAuctionType.AUCTION_TYPE_FIRST_PRICE;
    case ServerAdSetAuctionType.AUCTION_TYPE_SECOND_PRICE:
      return AdSetAuctionType.AUCTION_TYPE_SECOND_PRICE;
    case ServerAdSetAuctionType.AUCTION_TYPE_LOTTERY:
      return AdSetAuctionType.AUCTION_TYPE_LOTTERY;
    case ServerAdSetAuctionType.AUCTION_TYPE_FIRST_PRICE_PRIORITY:
      return AdSetAuctionType.AUCTION_TYPE_FIRST_PRICE_PRIORITY;
    default:
      return AdSetAuctionType.AUCTION_TYPE_SECOND_PRICE;
  }
};

const legacyCountryValuesThatMightBeInRegion: { [id: number]: RegionsAndLocationsFormInputObj } = {
  2: getMixedRegionCountryObjFromCountryCode('US') as RegionsAndLocationsFormInputObj,
  3: getMixedRegionCountryObjFromCountryCode('CA') as RegionsAndLocationsFormInputObj,
  4: getMixedRegionCountryObjFromCountryCode('GB') as RegionsAndLocationsFormInputObj,
  5: getMixedRegionCountryObjFromCountryCode('DE') as RegionsAndLocationsFormInputObj,
  6: getMixedRegionCountryObjFromCountryCode('FR') as RegionsAndLocationsFormInputObj,
  7: getMixedRegionCountryObjFromCountryCode('KR') as RegionsAndLocationsFormInputObj,
  8: getMixedRegionCountryObjFromCountryCode('JP') as RegionsAndLocationsFormInputObj,
  9: getMixedRegionCountryObjFromCountryCode('BR') as RegionsAndLocationsFormInputObj,
};

export const getEndUserAdSetRegionAndCountryTargeting = (adSetServerResponse: TODOFIXANY) => {
  const { targeting_criteria = {} } = adSetServerResponse;
  const { location_criteria = {} } = targeting_criteria;
  const { countries = [], regions = [] } = location_criteria;

  let finalRegions = (regions || []).map((reg: RegionsAndLocationsFormInputObj) => reg);
  let finalCountries = (countries || []).map((cou: RegionsAndLocationsFormInputObj) => cou);

  // For old targeting - some things that are coming back in the regions array are now countries. This code handles the special values that need to be converted.
  const invalidRegions = finalRegions.filter(
    (regionValue: number) => legacyCountryValuesThatMightBeInRegion[regionValue],
  );
  if (invalidRegions.length) {
    finalRegions = finalRegions.filter(
      (regionValue: number) => !legacyCountryValuesThatMightBeInRegion[regionValue],
    );
    const invalidRegionsConvertedToCountries = invalidRegions.map(
      (regionValue: number) => legacyCountryValuesThatMightBeInRegion[regionValue].value,
    );

    finalCountries = finalCountries.concat(invalidRegionsConvertedToCountries);
  }

  return {
    countries: (finalCountries || []).map(getCountryFromLocationCode).filter(Boolean),
    regions: (finalRegions || []).map(getRegionFromLocationCode).filter(Boolean),
  };
};

export const getEndUserAdSetLanguageTargeting = (adSetServerResponse: TODOFIXANY) => {
  const { targeting_criteria } = adSetServerResponse;
  const { language_criteria } = targeting_criteria;
  const { languages } = language_criteria;
  return {
    languages: languages
      ?.map((languageObj: TODOFIXANY) => languageObj.value)
      .map(getLanguageFromLanguageCode),
  };
};

const getGenderFromEnum = (genderEnumValue: TODOFIXANY) => {
  switch (genderEnumValue) {
    case ServerGenderType.GENDER_FEMALE:
      return AdsClientTypes.Gender.GENDER_FEMALE;
    case ServerGenderType.GENDER_MALE:
      return AdsClientTypes.Gender.GENDER_MALE;
    case ServerGenderType.GENDER_ANY:
      return AdsClientTypes.Gender.GENDER_ANY;
    default:
      return AdsClientTypes.Gender.GENDER_ANY;
  }
};

export const getEndUserAdSetGenderTargeting = (adSetServerResponse: TODOFIXANY) => {
  const { targeting_criteria } = adSetServerResponse;
  const { gender_criteria } = targeting_criteria;
  const { gender } = gender_criteria;
  return { gender: getGenderFromEnum(gender) };
};

export const getEndUserAdSetAgeTargeting = (adSetServerResponse: TODOFIXANY) => {
  const { targeting_criteria } = adSetServerResponse;
  const { age_criteria } = targeting_criteria;
  const { all_ages, lower_bound, upper_bound } = age_criteria;
  if (all_ages) {
    return {
      lowerBound: 13,
      upperBound: 65,
    };
  }
  return {
    lowerBound: lower_bound,
    upperBound: upper_bound,
  };
};

const getAgeBucketFromEnum = (ageBucketEnumValue: TODOFIXANY) => {
  switch (ageBucketEnumValue) {
    case ServerAgeBucketType.AGE_BUCKET_TYPE_5_TO_12:
      return AdsClientTypes.AgeBucketType.AGE_BUCKET_TYPE_5_TO_12;
    case ServerAgeBucketType.AGE_BUCKET_TYPE_13_TO_17:
      return AdsClientTypes.AgeBucketType.AGE_BUCKET_TYPE_13_TO_17;
    case ServerAgeBucketType.AGE_BUCKET_TYPE_18_TO_24:
      return AdsClientTypes.AgeBucketType.AGE_BUCKET_TYPE_18_TO_24;
    case ServerAgeBucketType.AGE_BUCKET_TYPE_25_PLUS:
      return AdsClientTypes.AgeBucketType.AGE_BUCKET_TYPE_25_PLUS;
    default:
      return AdsClientTypes.AgeBucketType.AGE_BUCKET_TYPE_UNDEFINED_INVALID;
  }
};

const getAgeBucketFromBounds = ({
  lower_bound,
  upper_bound,
}: {
  lower_bound: number;
  upper_bound: number;
}) => {
  const selectedAges = [];
  if (lower_bound >= 13 && upper_bound <= 17) {
    selectedAges.push(AdsClientTypes.AgeBucketType.AGE_BUCKET_TYPE_13_TO_17);
  }

  if (lower_bound >= 18 && upper_bound <= 25) {
    selectedAges.push(AdsClientTypes.AgeBucketType.AGE_BUCKET_TYPE_25_PLUS);
  }

  if (lower_bound >= 25) {
    selectedAges.push(AdsClientTypes.AgeBucketType.AGE_BUCKET_TYPE_25_PLUS);
  }

  return selectedAges;
};

export const getEndUserAdSetAgeBucketTargeting = (adSetServerResponse: TODOFIXANY) => {
  const { targeting_criteria = {} } = adSetServerResponse;
  const { age_bucket_criteria = {}, age_criteria = {} } = targeting_criteria;
  const { age_buckets = [], all_ages = false } = age_bucket_criteria;
  const { all_ages: all_ages_legacy, lower_bound = 0, upper_bound = 0 } = age_criteria;
  if (all_ages || all_ages_legacy) {
    // "all ages" on the server folds every applicable bucket (including 5-12)
    // into a single flag, so expand it back to all buckets here. Format/flag
    // applicability gating in the consuming forms hides or strips the 5-12
    // bucket where it does not apply.
    return {
      ageBuckets: [...ageBuckets, u13AgeBucket].map((ageBucketObj) => ageBucketObj.value),
    };
  }
  if (lower_bound && upper_bound) {
    getAgeBucketFromBounds({ lower_bound, upper_bound });
  }
  return {
    ageBuckets: age_buckets?.map(getAgeBucketFromEnum),
  };
};

const getDeviceFromEnum = (deviceEnumValue: TODOFIXANY) => {
  switch (deviceEnumValue) {
    case DeviceType.DEVICE_TYPE_COMPUTER:
      return AdsClientTypes.DeviceType.DEVICE_TYPE_COMPUTER;
    case DeviceType.DEVICE_TYPE_PHONE:
      return AdsClientTypes.DeviceType.DEVICE_TYPE_PHONE;
    case DeviceType.DEVICE_TYPE_TABLET:
      return AdsClientTypes.DeviceType.DEVICE_TYPE_TABLET;
    case DeviceType.DEVICE_TYPE_CONSOLE:
      return AdsClientTypes.DeviceType.DEVICE_TYPE_CONSOLE;
    case DeviceType.DEVICE_TYPE_ALL:
      return AdsClientTypes.DeviceType.DEVICE_TYPE_ALL;
    default:
      return AdsClientTypes.DeviceType.DEVICE_TYPE_ALL;
  }
};
export const getEndUserAdSetDeviceTargeting = (adSetServerResponse: TODOFIXANY) => {
  const { targeting_criteria } = adSetServerResponse;
  const { device_criteria } = targeting_criteria;
  const { devices } = device_criteria;
  return {
    devices: devices?.map(getDeviceFromEnum),
  };
};

export const getEndUserAdSetGenreTargeting = (adSetServerResponse: TODOFIXANY) => {
  const { targeting_criteria = {} } = adSetServerResponse;
  const { genre_criteria = {} } = targeting_criteria;
  const { genres = [] } = genre_criteria;

  const result = {
    genres: genres?.map(getGenreStringFromProtoVal),
  };
  if (!result.genres) {
    result.genres = [AllGenresObj];
  }

  return result;
};

const getEndUserSpend = (row: TODOFIXANY) => {
  if (row?.performance?.display_spending_micro_usd) {
    return microUsdToUsd(row?.performance?.display_spending_micro_usd);
  }

  if (row?.performance?.spend_micro_usd) {
    return microUsdToUsd(row?.performance?.spend_micro_usd);
  }
  return 0;
};

const getEndUserImpressions = (row: TODOFIXANY) => {
  if (row?.performance?.impression) {
    return Number(row?.performance?.impression);
  }

  return 0;
};

const isNonZeroNumber = (num: number) => {
  return typeof num === 'number' && num !== 0;
};

const END_USER_CARD_UNIT = 'USD';
const END_USER_LINE_OF_CREDIT_TYPE = 'Line of Credit';
export const END_USER_AD_CREDIT_PAYMENT_TYPE = 'Ad Credit';
export const END_USER_CARD_PAYMENT_TYPE = 'Card';

export const getPaymentTypeDisplayText = (paymentType: ServerPaymentType) => {
  switch (paymentType) {
    case ServerPaymentType.PAYMENT_TYPE_CARD:
      return END_USER_CARD_PAYMENT_TYPE;
    case ServerPaymentType.PAYMENT_TYPE_ADS_CREDIT:
      return END_USER_AD_CREDIT_PAYMENT_TYPE;
    case ServerPaymentType.PAYMENT_TYPE_INVOICE:
      return END_USER_LINE_OF_CREDIT_TYPE;
    // For all other payment types we want to display nothing in the table
    default:
      return '';
  }
};

export const getEndUserPaymentType = (row: TODOFIXANY) => {
  const { performance = {} } = row;
  const { payment_type = {} } = performance;

  return getPaymentTypeDisplayText(payment_type);
};

export const getEndUserPaymentUnit = (row: TODOFIXANY) => {
  const paymentType = getEndUserPaymentType(row);

  switch (paymentType) {
    case END_USER_AD_CREDIT_PAYMENT_TYPE:
      return END_USER_AD_CREDIT_PAYMENT_TYPE;
    case END_USER_CARD_PAYMENT_TYPE:
    case END_USER_LINE_OF_CREDIT_TYPE:
      return END_USER_CARD_UNIT;
    default:
      return '';
  }
};

const getEndUserPaymentUnitFromPaymentType = (paymentType: string) => {
  switch (paymentType) {
    case END_USER_AD_CREDIT_PAYMENT_TYPE:
      return END_USER_AD_CREDIT_PAYMENT_TYPE;
    case END_USER_CARD_PAYMENT_TYPE:
    case END_USER_LINE_OF_CREDIT_TYPE:
      return END_USER_CARD_UNIT;
    default:
      return '';
  }
};

export const toUsdString = (amt: number): string => {
  return `${amt.toLocaleString('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })} ${getEndUserPaymentUnitFromPaymentType(END_USER_CARD_PAYMENT_TYPE)}`;
};

export const toAdCreditString = (amt: number): string => {
  return `${amt.toLocaleString('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })} ${getEndUserPaymentUnitFromPaymentType(END_USER_AD_CREDIT_PAYMENT_TYPE)}`;
};

const getEndUserCPM = (row: TODOFIXANY) => {
  const { performance = {} } = row;
  const { cost_per_millie_usd } = performance;

  if (cost_per_millie_usd && isNonZeroNumber(cost_per_millie_usd)) {
    return `${cost_per_millie_usd.toLocaleString('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    })} ${getEndUserPaymentUnit(row)}`;
  }
  // Legacy Calculation
  if (row?.performance?.spend_micro_usd && row?.performance?.impression) {
    return row.performance.spend_micro_usd / (row.performance.impression * 1000);
  }

  return 0;
};

const getEndUserTeleports = (row: TODOFIXANY) => {
  if (row?.performance?.teleportation) {
    return Number(row?.performance?.teleportation);
  }
  return 0;
};

const getEndUserTeleportRate = (row: TODOFIXANY) => {
  if (row?.performance?.impression && row?.performance?.teleportation) {
    return row.performance.teleportation / row.performance.impression;
  }
  return 0;
};

const getEndUserCPT = (row: TODOFIXANY) => {
  if (row?.performance?.spend_micro_usd && row?.performance?.teleportation) {
    return row.performance.spend_micro_usd / 1000000 / row.performance.teleportation;
  }
  return 0;
};

const getEndUserClicks = (row: TODOFIXANY) => {
  const { performance = {} } = row;
  const { click_count } = performance;

  if (Number.isInteger(click_count) && isNonZeroNumber(Number(click_count))) {
    return click_count.toLocaleString();
  }

  return UNAVAILABLE_VALUE_DISPLAY;
};

const getEndUserPlays = (row: TODOFIXANY) => {
  const { performance = {} } = row;
  const { play_count } = performance;
  if (Number.isInteger(play_count) && isNonZeroNumber(play_count)) {
    return play_count.toLocaleString();
  }

  return UNAVAILABLE_VALUE_DISPLAY;
};

const getEndUserAveragePlayRate = (row: TODOFIXANY) => {
  const { performance = {} } = row;
  const { average_play_rate } = performance;

  if (isNonZeroNumber(average_play_rate) && !Number.isNaN(Number(average_play_rate))) {
    return `${average_play_rate.toFixed(2)}%`;
  }

  return UNAVAILABLE_VALUE_DISPLAY;
};

const getEndUserPlayRate = (row: TODOFIXANY) => {
  const { performance = {} } = row;
  const { play_rate } = performance;

  if (isNonZeroNumber(play_rate)) {
    return `${Number(play_rate).toFixed(2)}%`;
  }

  return UNAVAILABLE_VALUE_DISPLAY;
};

const getEndUserCPP = (row: TODOFIXANY) => {
  const { performance = {} } = row;
  const { cost_per_play_usd } = performance;

  if (isNonZeroNumber(cost_per_play_usd)) {
    return `${cost_per_play_usd.toLocaleString('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    })} ${getEndUserPaymentUnit(row)}`;
  }

  return UNAVAILABLE_VALUE_DISPLAY;
};

const getEndUserCTR = (row: TODOFIXANY) => {
  const { performance = {} } = row;
  const { click_count, impression } = performance;

  if (isNonZeroNumber(impression) && isNonZeroNumber(click_count)) {
    return `${ToFixedNoRounding((Number(click_count) / Number(impression)) * 100, 2)}%`;
  }

  return UNAVAILABLE_VALUE_DISPLAY;
};

const getEndUserCPC = (row: TODOFIXANY) => {
  const { performance = {} } = row;
  const { click_count, display_spending_micro_usd } = performance;

  if (isNonZeroNumber(display_spending_micro_usd) && isNonZeroNumber(click_count)) {
    const spendInUsd = microUsdToUsd(display_spending_micro_usd);
    const cpc = Number(spendInUsd) / Number(click_count);
    return `${cpc.toLocaleString('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    })} ${getEndUserPaymentUnit(row)}`;
  }
  return UNAVAILABLE_VALUE_DISPLAY;
};

const getEndUserPlayRateSummary = (tableSummaryRowData: TODOFIXANY) => {
  const { average_play_rate } = tableSummaryRowData;

  if (isNonZeroNumber(average_play_rate)) {
    return `${Number(average_play_rate).toFixed(2)}%`;
  }

  return UNAVAILABLE_VALUE_DISPLAY;
};

const getEndUserTwoSecondViews = (row: TODOFIXANY) => {
  const { performance = {} } = row;
  const { two_sec_video_view_count } = performance;
  if (Number.isInteger(two_sec_video_view_count) && isNonZeroNumber(two_sec_video_view_count)) {
    return two_sec_video_view_count.toLocaleString();
  }

  return UNAVAILABLE_VALUE_DISPLAY;
};

const getEndUserFifteenSecondViews = (row: TODOFIXANY) => {
  const { performance = {} } = row;
  const { fifteen_sec_video_view_count } = performance;
  if (
    Number.isInteger(fifteen_sec_video_view_count) &&
    isNonZeroNumber(fifteen_sec_video_view_count)
  ) {
    return fifteen_sec_video_view_count.toLocaleString();
  }

  return UNAVAILABLE_VALUE_DISPLAY;
};

const getEndUserCPV15 = (row: TODOFIXANY) => {
  const { performance = {} } = row;
  const { cost_per_fifteen_sec_video_view_usd } = performance;

  if (isNonZeroNumber(cost_per_fifteen_sec_video_view_usd)) {
    return `${cost_per_fifteen_sec_video_view_usd.toLocaleString('en-US', {
      maximumFractionDigits: 3,
      minimumFractionDigits: 3,
    })} ${getEndUserPaymentUnit(row)}`;
  }

  return UNAVAILABLE_VALUE_DISPLAY;
};

export const getEndUserAdSetExperienceTypesContainer = (row: TODOFIXANY) => {
  const { bidding_strategy: biddingInfo, promotes_seventeen_plus_universes: seventeenPlus } =
    row || {};
  const { bid_type: bidType } = biddingInfo || {};
  const experienceTypesContainerState = {
    paidAccess: false,
    seventeenPlus: false,
    toggleOn: false,
  };

  if (bidType === ServerAdSetBidType.CPC) {
    experienceTypesContainerState.toggleOn = true;
    experienceTypesContainerState.paidAccess = true;
  }

  if (seventeenPlus) {
    experienceTypesContainerState.toggleOn = true;
    experienceTypesContainerState.seventeenPlus = true;
  }

  return experienceTypesContainerState;
};

const getEndUserSpendSummary = (tableSummaryRowData: TODOFIXANY) => {
  const { ad_credit_display_spending, usd_display_spending } = tableSummaryRowData;
  let usdEndUserSpendString = '';
  let adCreditEndUserSpendString = '';

  if (usd_display_spending) {
    usdEndUserSpendString = `${usd_display_spending.toLocaleString('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    })} ${END_USER_CARD_UNIT}`;
  }

  if (ad_credit_display_spending) {
    adCreditEndUserSpendString = `${ad_credit_display_spending.toLocaleString('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    })} ${END_USER_AD_CREDIT_PAYMENT_TYPE}`;
  }
  return { adCreditEndUserSpendString, usdEndUserSpendString };
};

const getEndUserCPMSummary = (tableSummaryRowData: TODOFIXANY) => {
  const { ad_credit_average_cost_per_mille, usd_average_cost_per_mille } = tableSummaryRowData;
  let usdEndUserCPMString = '';
  let adCreditEndUserCPMString = '';

  if (usd_average_cost_per_mille) {
    usdEndUserCPMString = `${usd_average_cost_per_mille.toLocaleString('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    })} ${END_USER_CARD_UNIT}`;
  }

  if (ad_credit_average_cost_per_mille) {
    adCreditEndUserCPMString = `${ad_credit_average_cost_per_mille.toLocaleString('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    })} ${END_USER_AD_CREDIT_PAYMENT_TYPE}`;
  }
  return { adCreditEndUserCPMString, usdEndUserCPMString };
};

const getEndUserCPPSummary = (tableSummaryRowData: TODOFIXANY) => {
  const { ad_credit_average_cost_per_play, usd_average_cost_per_play } = tableSummaryRowData;
  let usdEndUserCPPString = '';
  let adCreditEndUserCPPString = '';

  if (usd_average_cost_per_play) {
    usdEndUserCPPString = `${usd_average_cost_per_play.toLocaleString('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    })} ${END_USER_CARD_UNIT}`;
  }

  if (ad_credit_average_cost_per_play) {
    adCreditEndUserCPPString = `${ad_credit_average_cost_per_play.toLocaleString('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    })} ${END_USER_AD_CREDIT_PAYMENT_TYPE}`;
  }

  return { adCreditEndUserCPPString, usdEndUserCPPString };
};

const getEndUserCPCSummary = (tableSummaryRowData: TODOFIXANY) => {
  // TODO
  const { ad_credit_average_cost_per_play, usd_average_cost_per_play } = tableSummaryRowData;
  let usdEndUserCPPString = '';
  let adCreditEndUserCPPString = '';

  if (usd_average_cost_per_play) {
    usdEndUserCPPString = `${usd_average_cost_per_play.toLocaleString('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    })} ${END_USER_CARD_UNIT}`;
  }

  if (ad_credit_average_cost_per_play) {
    adCreditEndUserCPPString = `${ad_credit_average_cost_per_play.toLocaleString('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    })} ${END_USER_AD_CREDIT_PAYMENT_TYPE}`;
  }

  return { adCreditEndUserCPPString, usdEndUserCPPString };
};

const getEndUserCTRSummary = () => {
  // TODO - When we fix AMA.
};

const getBackendStatusIsOn = (
  backendStatuses:
    | Map<string, GetCampaignStatusResponseType>
    | Map<string, GetAdSetStatusResponseType>
    | Map<string, GetAdStatusResponseType>,
  key: string,
) => {
  const isOn = backendStatuses.get(key)?.is_on;
  if (isOn === undefined) {
    return false;
  }
  return isOn;
};

const getBackendStatusDisabled = (
  backendStatuses:
    | Map<string, GetCampaignStatusResponseType>
    | Map<string, GetAdSetStatusResponseType>
    | Map<string, GetAdStatusResponseType>,
  key: string,
) => {
  const disabled = backendStatuses.get(key)?.disabled;
  if (disabled === undefined) {
    return true;
  }
  return disabled;
};

const calculateFractionalMetricRoundedDownToTwoDecimals = (
  numerator: number,
  denominator: number,
) => {
  if (numerator && denominator) {
    return roundFloatDownToTwoDecimals(Number(numerator / denominator));
  }
  return 0;
};

const getSummaryForFilteredRows = (filteredRows: TODOFIXANY[]) => {
  let totalAdCreditImpressions = 0;
  let totalAdCreditClicks = 0;
  let totalAdCreditPlays = 0;
  let totalAdCreditSpend = 0;
  let totalUSDImpressions = 0;
  let totalUSDClicks = 0;
  let totalUSDPlays = 0;
  let totalUSDSpend = 0;

  const impression_count = filteredRows.reduce(
    (accumulator, currentValue) => accumulator + currentValue.impressions,
    0,
  );

  const play_count = filteredRows.reduce((accumulator, currentValue) => {
    if (currentValue?.performance?.play_count) {
      return accumulator + currentValue.performance.play_count;
    }
    return accumulator;
  }, 0);

  const click_count = filteredRows.reduce((accumulator, currentValue) => {
    if (currentValue?.performance?.click_count) {
      return accumulator + currentValue.performance.click_count;
    }
    return accumulator;
  }, 0);

  // Sometimes this is 0/0 => NaN
  const avgPlayRate = calculateFractionalMetricRoundedDownToTwoDecimals(
    Number(play_count) * 100,
    Number(impression_count),
  );

  filteredRows.forEach((rowObj: TODOFIXANY) => {
    const paymentMethod = getEndUserPaymentType(rowObj);

    if (paymentMethod === END_USER_AD_CREDIT_PAYMENT_TYPE) {
      if (rowObj?.performance?.impression) {
        totalAdCreditImpressions += rowObj.performance.impression;
      }

      if (rowObj?.performance?.click_count) {
        totalAdCreditClicks += rowObj.performance.click_count;
      }

      if (rowObj?.performance?.play_count) {
        totalAdCreditPlays += rowObj.performance.play_count;
      }

      if (rowObj?.performance?.spend_micro_usd) {
        totalAdCreditSpend += Number(
          microUsdToUsd(rowObj?.performance?.display_spending_micro_usd || 0),
        );
      }
    } else {
      if (rowObj?.performance?.impression) {
        totalUSDImpressions += rowObj.performance.impression;
      }

      if (rowObj?.performance?.click_count) {
        totalUSDClicks += rowObj.performance.click_count;
      }

      if (rowObj?.performance?.play_count) {
        totalUSDPlays += rowObj.performance.play_count;
      }

      if (rowObj?.performance?.spend_micro_usd) {
        totalUSDSpend += Number(
          microUsdToUsd(rowObj?.performance?.display_spending_micro_usd || 0),
        );
      }
    }
  });

  const two_sec_video_view_count = filteredRows.reduce(
    (accumulator, currentValue) =>
      accumulator + (currentValue?.performance?.two_sec_video_view_count || 0),
    0,
  );

  const fifteen_sec_video_view_count = filteredRows.reduce(
    (accumulator, currentValue) =>
      accumulator + (currentValue?.performance?.fifteen_sec_video_view_count || 0),
    0,
  );

  const total_play_time_hours_7d = filteredRows.reduce(
    (accumulator, currentValue) =>
      accumulator + (currentValue?.performance?.total_play_time_hours_7d || 0),
    0,
  );

  const total_robux_revenue_30d = filteredRows.reduce(
    (accumulator, currentValue) =>
      accumulator + (currentValue?.performance?.total_robux_revenue_30d || 0),
    0,
  );

  const finalSummaryRowData = {
    ad_credit_average_cost_per_mille: calculateFractionalMetricRoundedDownToTwoDecimals(
      Number(totalAdCreditSpend) * 1000.0,
      Number(totalAdCreditImpressions),
    ),
    ad_credit_average_cost_per_play: calculateFractionalMetricRoundedDownToTwoDecimals(
      Number(totalAdCreditSpend),
      Number(totalAdCreditPlays),
    ),
    ad_credit_display_spending: totalAdCreditSpend,
    average_play_rate: Number.isNaN(avgPlayRate) ? undefined : avgPlayRate,
    click_count,
    // Should be rounded down to 3 decimals, but CPV15 is being deprecated anyways
    cost_per_fifteen_sec_video_view_usd: calculateFractionalMetricRoundedDownToTwoDecimals(
      Number(totalUSDSpend + totalAdCreditSpend),
      Number(fifteen_sec_video_view_count),
    ),
    fifteen_sec_video_view_count,
    impression_count,
    play_count,
    total_play_time_hours_7d,
    total_robux_revenue_30d,
    two_sec_video_view_count,
    usd_average_cost_per_mille: calculateFractionalMetricRoundedDownToTwoDecimals(
      Number(totalUSDSpend) * 1000.0,
      Number(totalUSDImpressions),
    ),
    usd_average_cost_per_play: calculateFractionalMetricRoundedDownToTwoDecimals(
      Number(totalUSDSpend),
      Number(totalUSDPlays),
    ),
    usd_display_spending: totalUSDSpend, // includes line of credit
  };

  return {
    filteredTableSummaryRowData: finalSummaryRowData,
    filteredTotalAdCreditClicks: totalAdCreditClicks,
    filteredTotalAdCreditSpend: totalAdCreditSpend,
    filteredTotalUSDClicks: totalUSDClicks,
    filteredTotalUSDSpend: totalUSDSpend,
  };
};

// A campaign is capable of cloning if it has exactly one ad set and one ad
const getCampaignCloningData = (key: string, allAdSets: TODOFIXANY, allAds: TODOFIXANY) => {
  // TODO: ADS-6766
  const adSets = filter(allAdSets, ({ campaign_id: campaignId }) => key === campaignId);
  const ads = filter(allAds, ({ campaign_id: campaignId }) => key === campaignId);
  return {
    adIdToClone: ads?.[0]?.id,
    adSetIdToClone: adSets?.[0]?.id,
    isCampaignCapableOfDuplication: size(adSets) === 1 && size(ads) === 1,
  };
};

const getEndUserTotalPlayTime7d = (row: TODOFIXANY) => {
  const { performance = {} } = row;
  const { total_play_time_hours_7d } = performance;

  if (total_play_time_hours_7d && isNonZeroNumber(total_play_time_hours_7d)) {
    return `${total_play_time_hours_7d.toLocaleString('en-US', {
      maximumFractionDigits: 1,
      minimumFractionDigits: 1,
    })} hours`;
  }

  return UNAVAILABLE_VALUE_DISPLAY;
};

const getEndUserTotalRobuxRevenue30d = (row: TODOFIXANY) => {
  const { performance = {} } = row;
  const { total_robux_revenue_30d } = performance;

  if (Number.isInteger(total_robux_revenue_30d) && isNonZeroNumber(total_robux_revenue_30d)) {
    return total_robux_revenue_30d.toLocaleString();
  }

  return UNAVAILABLE_VALUE_DISPLAY;
};

export const ServerToClient = {
  getAdSetBidTypeDisplayText,
  getAdSetFrequencyCapInfo,
  getAdStatusFormatDisplayText,
  getBackendStatusDisabled,
  getBackendStatusIsOn,
  getCampaignCloningData,
  getCampaignObjectiveDisplayText,
  getEndUserAdSetAuctionType,
  getEndUserAdSetBidInfo,
  getEndUserAdStatusFormat,
  getEndUserAveragePlayRate,
  getEndUserCampaignBudgetInfo,
  getEndUserCampaignObjectiveText,
  getEndUserClicks,
  getEndUserCPC,
  getEndUserCPCSummary,
  getEndUserCPM,
  getEndUserCPMSummary,
  getEndUserCPP,
  getEndUserCPPSummary,
  getEndUserCPT,
  getEndUserCPV15,
  getEndUserCTR,
  getEndUserCTRSummary,
  getEndUserFifteenSecondViews,
  getEndUserImpressions,
  getEndUserPaymentType,
  getEndUserPlayRate,
  getEndUserPlayRateSummary,
  getEndUserPlays,
  getEndUserSpend,
  getEndUserSpendSummary,
  getEndUserTeleportRate,
  getEndUserTeleports,
  getEndUserTotalPlayTime7d,
  getEndUserTotalRobuxRevenue30d,
  getEndUserTwoSecondViews,
  getFromServerCampaignBudgetInfo,
  getFromServerCampaignObjective,
  getPaymentTypeDisplayText,
  getSummaryForFilteredRows,
};

const mapPaymentMethodTypeFormikToServer = (paymentType: AdsClientTypes.PaymentMethodType) => {
  switch (paymentType) {
    case AdsClientTypes.PaymentMethodType.AD_CREDIT:
      return ServerPaymentType.PAYMENT_TYPE_ADS_CREDIT;
    case AdsClientTypes.PaymentMethodType.CARD:
      return ServerPaymentType.PAYMENT_TYPE_CARD;
    case AdsClientTypes.PaymentMethodType.INVOICE:
      return ServerPaymentType.PAYMENT_TYPE_INVOICE;
    default:
      return undefined;
  }
};

const convertFormikDataToProtoCampaign = (
  values: TODOFIXANY,
  isBusinessOrganization: boolean,
  isAccountInternalOrManaged: boolean = false,
  timeZone: string = 'America/Los_Angeles',
) => {
  let objective;
  let budgetInfo;
  let adCreditBudgetInfo;
  let advertiserDisplayName;

  if (values.campaignObjective === CampaignObjectiveType.AWARENESS) {
    objective = ServerCampaignObjectiveType.AWARENESS;
  }

  if (values.campaignObjective === CampaignObjectiveType.VISITS) {
    objective = ServerCampaignObjectiveType.VISITS;
  }

  if (values.campaignObjective === CampaignObjectiveType.VIDEO_VIEWS) {
    objective = ServerCampaignObjectiveType.VIDEO_VIEWS;
  }

  if (values.campaignPaymentMethod !== AdsClientTypes.PaymentMethodType.AD_CREDIT) {
    if (values.campaignBudgetType === AdsClientTypes.BudgetType.DAILY) {
      budgetInfo = {
        daily_budget_micro_usd: usdToMicroUsd(values.campaignBudgetCapUsd),
      };
    }

    if (values.campaignBudgetType === AdsClientTypes.BudgetType.LIFETIME) {
      budgetInfo = {
        lifetime_budget_micro_usd: usdToMicroUsd(values.campaignBudgetCapUsd),
      };
    }
  } else {
    // if Ad credit is selected as payment method, we want to use ad credit budget field
    if (values.campaignBudgetType === AdsClientTypes.BudgetType.DAILY) {
      adCreditBudgetInfo = {
        daily_budget_ad_credit_micro: usdToMicroUsd(values.campaignBudgetCapUsd),
      };
    }
    if (values.campaignBudgetType === AdsClientTypes.BudgetType.LIFETIME) {
      adCreditBudgetInfo = {
        lifetime_budget_ad_credit_micro: usdToMicroUsd(values.campaignBudgetCapUsd),
      };
    }
  }

  let campaignEndTime =
    values.campaignEndTimestampMs && new Date(values.campaignEndTimestampMs).getTime();

  // sending campaign end time 0 if user did not set it for the daily budget type
  if (values.campaignBudgetType === AdsClientTypes.BudgetType.DAILY && !values.campaignHasEndDate) {
    campaignEndTime = 0;
  }

  if (isBusinessOrganization) {
    advertiserDisplayName = values.campaignAdvertiserName;
  }

  return {
    ad_credit_budget: adCreditBudgetInfo,
    advertiser_name: advertiserDisplayName,
    budget: budgetInfo,
    end_timestamp_ms: campaignEndTime - GetTimezoneOffsetMs(timeZone),
    name: values.campaignName,
    objective,
    payment_type: isAccountInternalOrManaged
      ? ServerPaymentType.PAYMENT_TYPE_INVOICE
      : mapPaymentMethodTypeFormikToServer(values.campaignPaymentMethod),
    start_timestamp_ms:
      new Date(values.campaignStartTimestampMs).getTime() - GetTimezoneOffsetMs(timeZone),
  };
};

const mapDeviceTypesformikToServer = (stringEnum: string) => {
  switch (stringEnum) {
    case AdsClientTypes.DeviceType.DEVICE_TYPE_ALL:
      return DeviceType.DEVICE_TYPE_ALL;
    case AdsClientTypes.DeviceType.DEVICE_TYPE_COMPUTER:
      return DeviceType.DEVICE_TYPE_COMPUTER;
    case AdsClientTypes.DeviceType.DEVICE_TYPE_PHONE:
      return DeviceType.DEVICE_TYPE_PHONE;
    case AdsClientTypes.DeviceType.DEVICE_TYPE_TABLET:
      return DeviceType.DEVICE_TYPE_TABLET;
    case AdsClientTypes.DeviceType.DEVICE_TYPE_CONSOLE:
      return DeviceType.DEVICE_TYPE_CONSOLE;
    default:
      return DeviceType.DEVICE_TYPE_ALL;
    // Later: Console is not supported yet - add in later when it is
  }
};

const mapAuctionTypesformikToServer = (stringEnum: string) => {
  switch (stringEnum) {
    case AdSetAuctionType.AUCTION_TYPE_FIRST_PRICE:
      return ServerAdSetAuctionType.AUCTION_TYPE_FIRST_PRICE;
    case AdSetAuctionType.AUCTION_TYPE_SECOND_PRICE:
      return ServerAdSetAuctionType.AUCTION_TYPE_SECOND_PRICE;
    case AdSetAuctionType.AUCTION_TYPE_LOTTERY:
      return ServerAdSetAuctionType.AUCTION_TYPE_LOTTERY;
    case AdSetAuctionType.AUCTION_TYPE_FIRST_PRICE_PRIORITY:
      return ServerAdSetAuctionType.AUCTION_TYPE_FIRST_PRICE_PRIORITY;
    default:
      return ServerAdSetAuctionType.AUCTION_TYPE_FIRST_PRICE;
  }
};

const mapAgeBucketTypesformikToServer = (stringEnum: string) => {
  switch (stringEnum) {
    case AdsClientTypes.AgeBucketType.AGE_BUCKET_TYPE_5_TO_12:
      return ServerAgeBucketType.AGE_BUCKET_TYPE_5_TO_12;
    case AdsClientTypes.AgeBucketType.AGE_BUCKET_TYPE_13_TO_17:
      return ServerAgeBucketType.AGE_BUCKET_TYPE_13_TO_17;
    case AdsClientTypes.AgeBucketType.AGE_BUCKET_TYPE_18_TO_24:
      return ServerAgeBucketType.AGE_BUCKET_TYPE_18_TO_24;
    case AdsClientTypes.AgeBucketType.AGE_BUCKET_TYPE_25_PLUS:
      return ServerAgeBucketType.AGE_BUCKET_TYPE_25_PLUS;
    default:
      return ServerAgeBucketType.AGE_BUCKET_TYPE_UNDEFINED_INVALID;
  }
};

const getEffectiveAgeBuckets = (values: TODOFIXANY): AdsClientTypes.AgeBucketType[] => {
  const allBuckets: AdsClientTypes.AgeBucketType[] =
    values?.adSetAgeBucketTargeting?.ageBuckets || [];
  if (values.adType === AdFormatType.TILE) {
    return allBuckets.filter(
      (bucket) => bucket !== AdsClientTypes.AgeBucketType.AGE_BUCKET_TYPE_5_TO_12,
    );
  }
  return allBuckets;
};

// Returns the total number of age buckets applicable for the given ad type.
// For TILE only the 3 standard buckets apply; for DISPLAY/VIDEO/PORTAL
// the u13 (5-12) bucket is also applicable, making 4 total.
const getApplicableAgeBucketCount = (values: TODOFIXANY): number => {
  if (values.adType === AdFormatType.TILE) {
    return ageBuckets.length;
  }
  return ageBuckets.length + 1;
};

const mapGenderTypeFormikToServer = (gender: AdsClientTypes.Gender) => {
  switch (gender) {
    case AdsClientTypes.Gender.GENDER_ANY:
      return ServerGenderType.GENDER_ANY;
    case AdsClientTypes.Gender.GENDER_FEMALE:
      return ServerGenderType.GENDER_FEMALE;
    case AdsClientTypes.Gender.GENDER_MALE:
      return ServerGenderType.GENDER_MALE;
    default:
      return undefined;
  }
};

const convertToFrequencyCappingRules = (capOn: boolean, capValue: number) => {
  if (capOn === false) {
    return [];
  }
  return [{ value: capValue }];
};

const convertFormikDataToProtoAdSet = (values: TODOFIXANY): AdsClientTypes.CreateAdSetRequest => {
  let biddingStrategyInfo;
  const gender = mapGenderTypeFormikToServer(values.adSetGenderTargeting.gender);
  const bidType = mapBidTypeFormikToServer(values.adSetBidType);
  let ageTargeting;
  let brandSuitabilityType;

  if (
    // TODO: Remember to separate this out when we support non Fixed CPM
    bidType === ServerAdSetBidType.CPM
  ) {
    biddingStrategyInfo = {
      bid_type: bidType,
      bid_value_micro_usd: usdToMicroUsd(values.adSetBidValueUsd),
    };
  } else if (bidType === ServerAdSetBidType.CPV15) {
    biddingStrategyInfo = {
      bid_type: ServerAdSetBidType.CPV15,
      bid_value_micro_usd: usdToMicroUsd(values.adSetBidValueUsd),
    };
  } else if (bidType === ServerAdSetBidType.CPC) {
    biddingStrategyInfo = {
      bid_type: ServerAdSetBidType.CPC,
      bid_value_micro_usd: usdToMicroUsd(values.adSetBidValueUsd),
    };
  } else {
    biddingStrategyInfo = {
      bid_type: ServerAdSetBidType.CPT,
      bid_value_micro_usd: usdToMicroUsd(values.adSetBidValueUsd),
    };
  }

  if (values.adType !== AdFormatType.TILE) {
    brandSuitabilityType = mapBrandSuitabilityTypeFormikToServer(values.adSetBrandSuitabilityType);
  }

  const effectiveAgeBuckets = getEffectiveAgeBuckets(values);
  const targetAllAgeBuckets =
    effectiveAgeBuckets.length === getApplicableAgeBucketCount(values) ||
    values?.ageCriteria?.allAges;
  const ageBucketTargeting = {
    age_buckets: targetAllAgeBuckets
      ? undefined
      : effectiveAgeBuckets.map(mapAgeBucketTypesformikToServer),
    all_ages: targetAllAgeBuckets,
  };

  const allDevicesPresent = values.adSetDeviceTargeting.devices?.includes(
    AdsClientTypes.DeviceType.DEVICE_TYPE_ALL,
  );

  const protoAdSet: AdsClientTypes.CreateAdSetRequest = {
    auction_type: mapAuctionTypesformikToServer(values.adSetAuctionType),
    bidding_strategy: biddingStrategyInfo,
    brand_suitability: brandSuitabilityType,
    frequency_capping_rules: convertToFrequencyCappingRules(
      values.adSetFrequencyCapOn,
      values.adSetFrequencyCapValue,
    ),
    name: values.adSetName,
    targeting_criteria: {
      age_bucket_criteria: ageBucketTargeting,
      age_criteria: ageTargeting,
      device_criteria: {
        devices: allDevicesPresent
          ? [DeviceType.DEVICE_TYPE_ALL]
          : values.adSetDeviceTargeting.devices.map(mapDeviceTypesformikToServer),
      },
      gender_criteria: {
        gender,
      },
      language_criteria: {
        languages: values.adSetLanguageTargeting.languages.map((obj: TODOFIXANY) => obj.value),
      },
    },
  };

  const genreTargeting = {
    genres: values.adSetGenreTargeting.genres.map((obj: TODOFIXANY) => obj.value),
  };
  protoAdSet.targeting_criteria.genre_criteria = genreTargeting;

  const locationTargeting: TODOFIXANY = {};
  locationTargeting.regions = values.adSetMixedRegionAndCountryTargeting.regions.map(
    (obj: TODOFIXANY) => obj.value,
  );
  locationTargeting.countries = values.adSetMixedRegionAndCountryTargeting.countries.map(
    (obj: TODOFIXANY) => obj.value,
  );

  protoAdSet.targeting_criteria.location_criteria = locationTargeting;

  return protoAdSet;
};

type VideoAdMetadataType = {
  asset_metadata: TODOFIXANY;
  video_duration_ms?: number;
};

const convertFormikDataToProtoAd = (values: TODOFIXANY) => {
  let portalAdMetadata;
  let displayAdMetadata;
  let tileAdMetadata;
  let videoAdMetadata: VideoAdMetadataType | undefined;

  if (values.adType === AdFormatType.DISPLAY) {
    displayAdMetadata = {
      asset_metadata: {
        asset_id: values.adAssetId,
        // Replace with enum later
        asset_status: 0,
        // https://github.rbx.com/Roblox/ads/blob/4ea5e5263b21adde1bc817f9ce8029968dc231e3/protos/roblox/ads/shared/enums/v1/ad_entity_enums.proto#L171
        asset_type: AdsClientTypes.ServerAssetType.IMAGE,
        height: values.adAssetHeight,
        width: values.adAssetWidth,
      },
    };
  }

  if (values.adType === AdFormatType.PORTAL) {
    portalAdMetadata = {
      banner_asset_metadata: {
        asset_id: values.adAssetId,
        // https://github.rbx.com/Roblox/ads/blob/4ea5e5263b21adde1bc817f9ce8029968dc231e3/protos/roblox/ads/shared/enums/v1/ad_entity_enums.proto#L171
        asset_type: AdsClientTypes.ServerAssetType.IMAGE,
        height: values.adAssetHeight,
        width: values.adAssetWidth,
      },
      target_place_id: values.adPortalDestinationPlaceId,
      text: values.adPortalDestinationText,
    };
  }

  if (values.adType === AdFormatType.VIDEO) {
    videoAdMetadata = {
      asset_metadata: {
        asset_id: values.adVideoAssetId,
        // https://github.rbx.com/Roblox/ads/blob/4ea5e5263b21adde1bc817f9ce8029968dc231e3/protos/roblox/ads/shared/enums/v1/ad_entity_enums.proto#L171
        asset_type: AdsClientTypes.ServerAssetType.ADS_VIDEO,
        height: values.adAssetHeight,
        width: values.adAssetWidth,
      },
    };

    videoAdMetadata.video_duration_ms = values.adVideoDurationMs;
  }

  if (values.adType === AdFormatType.TILE) {
    tileAdMetadata = {
      target_universe_id: values.adDestinationUniverseId,
    };
  }

  return {
    display_ad_metadata: displayAdMetadata,
    name: values.adName,
    portal_ad_metadata: portalAdMetadata,
    sponsored_universe_ad_metadata: tileAdMetadata,
    video_ad_metadata: videoAdMetadata,
  };
};

const convertFormikDataToProtoAdV2 = (values: TODOFIXANY) => {
  const v1Ad = convertFormikDataToProtoAd(values);

  const v2Ad = cloneDeep(v1Ad);

  if (v2Ad.sponsored_universe_ad_metadata) {
    delete v2Ad.sponsored_universe_ad_metadata.target_universe_id;
  }

  return v2Ad;
};

const convertFormikDataToAudienceEstimateInfo = (values: TODOFIXANY) => {
  const gender = mapGenderTypeFormikToServer(values.adSetGenderTargeting.gender);

  let ageTargeting;

  const effectiveAgeBucketsAudienceEstimate = getEffectiveAgeBuckets(values);
  const targetAllAgeBuckets =
    effectiveAgeBucketsAudienceEstimate.length === getApplicableAgeBucketCount(values) ||
    values?.ageCriteria?.allAges;
  const ageBucketTargeting = {
    age_buckets: targetAllAgeBuckets
      ? undefined
      : effectiveAgeBucketsAudienceEstimate.map(mapAgeBucketTypesformikToServer),
    all_ages: targetAllAgeBuckets,
  };

  const allDevicesPresent = values.adSetDeviceTargeting.devices.includes(
    AdsClientTypes.DeviceType.DEVICE_TYPE_ALL,
  );

  let ad_type;
  switch (values.adType) {
    case AdFormatType.DISPLAY:
      ad_type = [AdsClientTypes.ServerAdFormatType.DISPLAY];
      break;
    case AdFormatType.PORTAL:
      ad_type = [AdsClientTypes.ServerAdFormatType.PORTAL];
      break;
    case AdFormatType.TILE:
      ad_type = [AdsClientTypes.ServerAdFormatType.TILE];
      break;
    case AdFormatType.VIDEO:
      // TODO: Update after we get more data. Until after we get 30 days of real traffic we assume that display and video traffic will be identical (as they will begin the same)
      ad_type = [AdsClientTypes.ServerAdFormatType.DISPLAY];
      break;
    default:
      ad_type = [undefined];
      break;
  }

  let universe_suitability_filter = values.adSetBrandSuitabilityType;
  if (values.adType === AdFormatType.TILE) {
    universe_suitability_filter =
      ServerAdSetBrandSuitabilityType.UNIVERSE_SUITABILITY_FILTER_UNSPECIFIED;
  }

  const genreTargeting = values.adSetGenreTargeting.genres.map((obj: TODOFIXANY) => obj.value);

  return {
    ad_type,
    targeting_criteria: {
      age_bucket_criteria: ageBucketTargeting,
      age_criteria: ageTargeting,
      device_criteria: {
        devices: allDevicesPresent
          ? [DeviceType.DEVICE_TYPE_ALL]
          : values.adSetDeviceTargeting.devices.map(mapDeviceTypesformikToServer),
      },

      gender_criteria: {
        gender,
      },
      genre_criteria: {
        genres: genreTargeting,
      },
      language_criteria: {
        languages: values.adSetLanguageTargeting.languages.map((obj: TODOFIXANY) => obj.value),
      },
      location_criteria: {
        countries:
          values?.adSetMixedRegionAndCountryTargeting?.countries?.map(
            (obj: TODOFIXANY) => obj.value,
          ) || [],
        regions:
          values?.adSetMixedRegionAndCountryTargeting?.regions?.map(
            (obj: TODOFIXANY) => obj.value,
          ) || [],
      },
    },
    universe_suitability_filter: mapBrandSuitabilityTypeFormikToServer(universe_suitability_filter),
  };
};

const convertAdAccountFormCountryToServerCountryEnum = (countryObj: {
  title: string;
  value: string;
}) => {
  return countryObj.value;
};

const convertAdAccountFormTimeZoneToServerCountryEnum = (timeZoneObj: {
  title: string;
  value: number;
}): AdsClientTypes.ServerTimeZoneMappings => {
  return timeZoneObj.value;
};

const convertFormikDataToAdAccountForSubmitting = (values: TODOFIXANY): CreateAdAccountRequest => {
  // TODO: Update this if the update call gets updated as well below and vice versa.
  // Default value is business
  let orgType = AdsClientTypes.OrganizationType.ORGANIZATION_TYPE_BUSINESS;
  let businessNameObj;
  let personalNameObj;

  if (values.adAccountType === AdAccountTypeFromModel.Business) {
    orgType = AdsClientTypes.OrganizationType.ORGANIZATION_TYPE_BUSINESS;
    businessNameObj = {
      name: values.adAccountValidBusinessName.trim(),
    };
  }

  if (values.adAccountType === AdAccountTypeFromModel.Personal) {
    orgType = AdsClientTypes.OrganizationType.ORGANIZATION_TYPE_INDIVIDUAL;
    personalNameObj = {
      first_name: values.adAccountFirstName.trim(),
      last_name: values.adAccountLastName.trim(),
    };
  }

  // for create call, only send the field if user enters the optional fields
  // including tax info, postal code and optional address line
  let taxInfoObj = null;
  if (values.adAccountTaxId.trim() !== '') {
    taxInfoObj = values.adAccountTaxId.trim();
  }

  const organization = {
    address: {
      country: convertAdAccountFormCountryToServerCountryEnum(values.adAccountCountry),
    },
    business_name: businessNameObj,
    individual_name: personalNameObj,
    tax_id: values.adAccountTaxId.trim(),
    tax_info: taxInfoObj,
    time_zone: convertAdAccountFormTimeZoneToServerCountryEnum(values.adAccountTimeZone),
    type: orgType,
  };

  const ad_account = {
    name: values.adAccountNickname.trim(),
  };

  const signed_terms_of_service = values.adAccountTermsCheckbox;

  return {
    ad_account,
    organization,
    signed_terms_of_service,
  };
};

const convertHookFormDataToUpdateAdvertiserRequestForSubmitting = ({
  adAccountInfo = {},
  organizationInfo = {},
  values,
}: {
  adAccountInfo: TODOFIXANY;
  organizationInfo: TODOFIXANY;
  values: TODOFIXANY;
}): UpdateAdvertiserRequest => {
  // TODO: Update this if the create call gets updated as well above ^ and vice versa.
  let businessNameObj;
  let personalNameObj;
  let taxInfoObj = null;

  if (organizationInfo.type === AdAccountTypeFromModel.Business) {
    businessNameObj = {
      name: values.adAccountValidBusinessName.trim(),
    };
  }

  if (organizationInfo.type === AdAccountTypeFromModel.Personal) {
    personalNameObj = {
      first_name: values.adAccountFirstName.trim(),
      last_name: values.adAccountLastName.trim(),
    };
  }

  if (organizationInfo.tax_info?.value !== values.adAccountTaxId?.trim()) {
    // no need to wrap this in object with request
    taxInfoObj = values.adAccountTaxId?.trim();
  }

  const organization = {
    address: {
      country: convertAdAccountFormCountryToServerCountryEnum(values.adAccountCountry),
    },
    business_name: businessNameObj,
    id: organizationInfo!.id,
    individual_name: personalNameObj,
    tax_id: values.adAccountTaxId?.trim(), // TODO: remove after switch to use tax_info
    tax_info: taxInfoObj,
  };

  const ad_account = {
    id: adAccountInfo!.id,
    name: values.adAccountNickname.trim(),
  };

  return {
    ad_account,
    organization,
  };
};

const convertFormikDataToCampaignForSubmitting = (
  values: TODOFIXANY,
  isBusinessOrganization: boolean,
  idempotencyKey: string,
  isAccountInternalOrManaged: boolean = false,
  timeZone: string = 'America/Los_Angeles',
) => ({
  ad: convertFormikDataToProtoAd(values),
  ad_set: convertFormikDataToProtoAdSet(values),
  campaign: convertFormikDataToProtoCampaign(
    values,
    isBusinessOrganization,
    isAccountInternalOrManaged,
    timeZone,
  ),
  idempotency_key: idempotencyKey,
});

const convertFormikDataToCampaignForSubmittingV2 = (
  values: TODOFIXANY,
  isBusinessOrganization: boolean,
  idempotencyKey: string,
  isAccountInternalOrManaged: boolean = false,
  timeZone: string = 'America/Los_Angeles',
) => {
  const v2Ad = convertFormikDataToProtoAdV2(values);
  const isVisitsBased = values.campaignObjective === CampaignObjectiveType.VISITS;
  const v2Data = {
    ad: v2Ad,
    ad_set: convertFormikDataToProtoAdSet(values),
    campaign: {
      ...convertFormikDataToProtoCampaign(
        values,
        isBusinessOrganization,
        isAccountInternalOrManaged,
        timeZone,
      ),
      universe_id: isVisitsBased ? values.adDestinationUniverseId : undefined,
    },
    idempotency_key: idempotencyKey,
  };
  return v2Data;
};

export const convertFormikDataToUpdateCampaignRequest = (
  currentCampaign: TODOFIXANY,
  updatedValues: TODOFIXANY,
  timeZone: string,
) => {
  let budgetInfo;
  let campaignStartTime;
  let campaignEndTime;
  let campaignName;
  let campaignAdvertiserName;

  if (currentCampaign.name !== updatedValues.campaignName.trim()) {
    campaignName = updatedValues.campaignName.trim();
  }

  if (currentCampaign.advertiser_name !== updatedValues.campaignAdvertiserName.trim()) {
    campaignAdvertiserName = updatedValues.campaignAdvertiserName.trim();
  }

  if (
    updatedValues.campaignBudgetType === AdsClientTypes.BudgetType.DAILY &&
    currentCampaign.budget.daily_budget_micro_usd !==
      usdToMicroUsd(updatedValues.campaignBudgetCapUsd)
  ) {
    budgetInfo = {
      daily_budget_micro_usd: usdToMicroUsd(updatedValues.campaignBudgetCapUsd),
    };
  }

  if (
    updatedValues.campaignBudgetType === AdsClientTypes.BudgetType.LIFETIME &&
    currentCampaign.budget.lifetime_budget_micro_usd !==
      usdToMicroUsd(updatedValues.campaignBudgetCapUsd)
  ) {
    budgetInfo = {
      lifetime_budget_micro_usd: usdToMicroUsd(updatedValues.campaignBudgetCapUsd),
    };
  }

  const formikStartTimestamp =
    new Date(updatedValues.campaignStartTimestampMs).getTime() - GetTimezoneOffsetMs(timeZone);
  if (new Date(currentCampaign.start_timestamp_ms).getTime() !== formikStartTimestamp) {
    campaignStartTime = formikStartTimestamp;
  }

  const formikEndTimestamp =
    new Date(updatedValues.campaignEndTimestampMs).getTime() - GetTimezoneOffsetMs(timeZone);
  if (
    new Date(currentCampaign.end_timestamp_ms).getTime() !== formikEndTimestamp ||
    updatedValues.campaignHasEndDateBeforeChange !== updatedValues.campaignHasEndDate
  ) {
    // sending campaign end time 0 if user removed the end date for the daily
    // budget type campaign
    if (
      updatedValues.campaignBudgetType === AdsClientTypes.BudgetType.DAILY &&
      !updatedValues.campaignHasEndDate
    ) {
      campaignEndTime = currentCampaign.end_timestamp_ms !== 0 ? 0 : undefined;
    } else {
      campaignEndTime = formikEndTimestamp;
    }
  }

  return {
    campaign: {
      advertiser_name: campaignAdvertiserName,
      budget: budgetInfo,
      end_timestamp_ms: campaignEndTime,
      name: campaignName,
      start_timestamp_ms: campaignStartTime,
    },
  };
};

export const convertFormikDataToUpdateAdSetRequest = (
  currentAdSet: TODOFIXANY,
  updatedValues: TODOFIXANY,
) => {
  let adSetName;
  let biddingInfo;
  if (currentAdSet.name !== updatedValues.adSetName.trim()) {
    adSetName = updatedValues.adSetName.trim();
  }
  if (
    currentAdSet.bidding_strategy.bid_value_micro_usd !==
    usdToMicroUsd(updatedValues.adSetBidValueUsd)
  ) {
    biddingInfo = {
      bid_value_micro_usd: usdToMicroUsd(updatedValues.adSetBidValueUsd),
    };
  }

  return {
    ad_set: {
      bidding_strategy: biddingInfo,
      name: adSetName,
    },
  };
};

export const convertFormikDataToUpdateAdRequest = (
  currentAd: TODOFIXANY,
  updatedValues: TODOFIXANY,
) => {
  let adName;
  if (currentAd.name !== updatedValues.adName.trim()) {
    adName = updatedValues.adName.trim();
  }
  return {
    ad: {
      name: adName,
    },
  };
};

export const convertPaymentTypeServerToClient = (serverPaymentType: ServerPaymentType) => {
  switch (serverPaymentType) {
    case ServerPaymentType.PAYMENT_TYPE_CARD:
      return AdsClientTypes.PaymentMethodType.CARD;
    case ServerPaymentType.PAYMENT_TYPE_ADS_CREDIT:
      return AdsClientTypes.PaymentMethodType.AD_CREDIT;
    case ServerPaymentType.PAYMENT_TYPE_INVOICE:
      return AdsClientTypes.PaymentMethodType.INVOICE;
    default:
      return AdsClientTypes.PaymentMethodType.CARD;
  }
};

export const getEndUserAdSetPlacement = (
  adSetRow: ServerGetAdSetRowResponse,
  allAds: TODOFIXANY = [],
) => {
  const childrenAds = getAllAdsUnderAdSet(adSetRow, allAds);

  if (!childrenAds || childrenAds.length === 0) {
    return 'In-Experience';
  }

  switch (childrenAds[0].type) {
    case AdFormatType.SEARCH:
      return 'Search Experience';
    case AdFormatType.TILE:
      return 'Sponsored Experience';
    case AdFormatType.PORTAL:
      return 'In-Experience Portal';
    case AdFormatType.VIDEO:
      return 'In-Experience Video';
    default:
      return 'In-Experience Image';
  }
};

export const ClientToServer = {
  convertFormikDataToAdAccountForSubmitting,
  convertFormikDataToAudienceEstimateInfo,
  convertFormikDataToCampaignForSubmitting,
  convertFormikDataToCampaignForSubmittingV2,
  convertFormikDataToProtoAd,
  convertFormikDataToProtoAdSet,
  convertFormikDataToProtoAdV2,
  convertFormikDataToProtoCampaign,
  convertHookFormDataToUpdateAdvertiserRequestForSubmitting,
};
