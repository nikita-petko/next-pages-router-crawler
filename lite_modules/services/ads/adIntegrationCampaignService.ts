import { AdPolicyReviewLabelType } from '@rbx/ads-moderation-ui';
import {
  AdIntegrationCampaign,
  AdIntegrationPlacement,
  AdIntegrationsApi,
  CreateAdIntegrationCampaignRequest,
  PublisherEligibleUniverse,
  UpdateAdIntegrationCampaignRequest,
} from '@rbx/client-ads-management-api/v1';
import moment from 'moment-timezone';

import developClient from '@clients/develop';
import { AD_POLICY_REVIEW_LABEL_PREFIX, AdsCategoryOtherValue } from '@constants/adIntegrations';
import { DateFormat, TimeFormat } from '@constants/campaignBuilder';
import { PUBLIC_UNIVERSE_PRIVACY_TYPE } from '@constants/universeConstants';
import {
  AdIntegrationCampaignDetailsChangedFields,
  AdIntegrationCampaignDetailsFormValues,
  AdIntegrationCampaignListItem,
  AdIntegrationCampaignWithPlacements,
  RevenueShareEstimatePreview,
} from '@type/adIntegrations';
import { ListUniversesCanAdvertiseResponse, UniverseShapeType } from '@type/universe';
import { createAdsManagementApiConfiguration } from '@utils/adsManagementApiDevOverride';

export interface AssetDetailsCreator {
  targetId?: number;
  type?: string;
  typeId?: number;
}

export interface AssetDetails {
  creator?: AssetDetailsCreator;
  description?: string;
  id: number;
  // Moderation signals from develop `/v1/assets`: `isModerated` flips true once
  // an asset is flagged; `moderationStatus` is a traffic-light string
  // (`"Green"` = clean); `reviewStatus` is `"Finished"` once review completes.
  // Consumed by the AI-creative reference picker's fail-open moderation gate.
  isModerated?: boolean;
  moderationStatus?: string;
  name: string;
  reviewStatus?: string;
  type?: string;
}

interface AssetDetailsApiResponse {
  data: AssetDetails[];
}

const configuration = createAdsManagementApiConfiguration();

const adIntegrationsClient = new AdIntegrationsApi(configuration);
const AD_INTEGRATIONS_LIST_PAGE_SIZE = 100;
// During enum migration we may receive either legacy (`IMMERSIVE_BRANDED_AD_*`)
// or new (`AD_INTEGRATION_*`) prefixes for ad integration campaign enums.
const AD_INTEGRATION_CAMPAIGN_ENUM_PREFIXES = ['IMMERSIVE_BRANDED_AD', 'AD_INTEGRATION'] as const;
const DEFAULT_AD_INTEGRATION_CAMPAIGN_ENUM_PREFIX = AD_INTEGRATION_CAMPAIGN_ENUM_PREFIXES[0];
const REWARDED_INTEGRATION_DECLARED_LABEL = 'REWARDED_INTEGRATION';
const UNSPECIFIED_DECLARED_LABEL = AdPolicyReviewLabelType[
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_UNSPECIFIED
].slice(AD_POLICY_REVIEW_LABEL_PREFIX.length);
type AdIntegrationCampaignEnumPrefix = (typeof AD_INTEGRATION_CAMPAIGN_ENUM_PREFIXES)[number];
type AdIntegrationCampaignStatusKey = 'ENABLED' | 'STOPPED' | 'ARCHIVED';
type AdIntegrationCampaignModerationStatusKey = 'APPROVED' | 'IN_REVIEW' | 'LIMITED' | 'REJECTED';

const buildAdIntegrationCampaignStatus = (
  status: AdIntegrationCampaignStatusKey,
  prefix: AdIntegrationCampaignEnumPrefix = DEFAULT_AD_INTEGRATION_CAMPAIGN_ENUM_PREFIX,
): string => `${prefix}_CAMPAIGN_STATUS_${status}`;
const buildAdIntegrationCampaignModerationStatus = (
  status: AdIntegrationCampaignModerationStatusKey,
  prefix: AdIntegrationCampaignEnumPrefix = DEFAULT_AD_INTEGRATION_CAMPAIGN_ENUM_PREFIX,
): string => `${prefix}_CAMPAIGN_MODERATION_STATUS_${status}`;

export const AD_INTEGRATION_CAMPAIGN_STATUS = {
  ARCHIVED: buildAdIntegrationCampaignStatus('ARCHIVED'),
  ENABLED: buildAdIntegrationCampaignStatus('ENABLED'),
  STOPPED: buildAdIntegrationCampaignStatus('STOPPED'),
} as const;
type AdIntegrationCampaignStatus =
  (typeof AD_INTEGRATION_CAMPAIGN_STATUS)[keyof typeof AD_INTEGRATION_CAMPAIGN_STATUS];
export const AD_INTEGRATION_CAMPAIGN_MODERATION_STATUS = {
  APPROVED: buildAdIntegrationCampaignModerationStatus('APPROVED'),
  IN_REVIEW: buildAdIntegrationCampaignModerationStatus('IN_REVIEW'),
  LIMITED: buildAdIntegrationCampaignModerationStatus('LIMITED'),
  REJECTED: buildAdIntegrationCampaignModerationStatus('REJECTED'),
} as const;

const isParsedAdIntegrationCampaignStatus = (
  rawStatus: string,
  expectedStatus: AdIntegrationCampaignStatusKey,
): boolean =>
  AD_INTEGRATION_CAMPAIGN_ENUM_PREFIXES.some(
    (prefix) => rawStatus === buildAdIntegrationCampaignStatus(expectedStatus, prefix),
  );

export const parseAdIntegrationCampaignStatus = (
  status?: string,
): AdIntegrationCampaignStatusKey | undefined => {
  if (!status) {
    return undefined;
  }

  // Normalize both supported prefixes into a single canonical key for consumer logic.
  if (isParsedAdIntegrationCampaignStatus(status, 'ENABLED')) {
    return 'ENABLED';
  }
  if (isParsedAdIntegrationCampaignStatus(status, 'STOPPED')) {
    return 'STOPPED';
  }
  if (isParsedAdIntegrationCampaignStatus(status, 'ARCHIVED')) {
    return 'ARCHIVED';
  }

  return undefined;
};

const isParsedAdIntegrationCampaignModerationStatus = (
  rawStatus: string,
  expectedStatus: AdIntegrationCampaignModerationStatusKey,
): boolean =>
  AD_INTEGRATION_CAMPAIGN_ENUM_PREFIXES.some(
    (prefix) => rawStatus === buildAdIntegrationCampaignModerationStatus(expectedStatus, prefix),
  );

export const parseAdIntegrationCampaignModerationStatus = (
  status?: string,
): AdIntegrationCampaignModerationStatusKey | undefined => {
  if (!status) {
    return undefined;
  }

  // Normalize both supported prefixes into a single canonical key for consumer logic.
  if (isParsedAdIntegrationCampaignModerationStatus(status, 'APPROVED')) {
    return 'APPROVED';
  }
  if (isParsedAdIntegrationCampaignModerationStatus(status, 'IN_REVIEW')) {
    return 'IN_REVIEW';
  }
  if (isParsedAdIntegrationCampaignModerationStatus(status, 'LIMITED')) {
    return 'LIMITED';
  }
  if (isParsedAdIntegrationCampaignModerationStatus(status, 'REJECTED')) {
    return 'REJECTED';
  }

  return undefined;
};

const formatDateTimeToApiTimestamp = (
  date: string,
  time: string,
  timezoneDbName: string,
): number => {
  const combined = `${date} ${time}`;
  const parsed = moment.tz(combined, `${DateFormat} ${TimeFormat}`, timezoneDbName);
  if (!parsed.isValid()) {
    throw new Error(`Invalid date/time value "${combined}" in timezone "${timezoneDbName}"`);
  }
  return parsed.valueOf();
};

const formatApiTimestampToFormValues = (
  timestampMs: number | undefined,
  timezoneDbName: string,
): { date: string; time: string } => {
  if (!timestampMs) {
    return { date: '', time: '' };
  }
  const m = moment.tz(timestampMs, timezoneDbName);
  return {
    date: m.format(DateFormat),
    time: m.format(TimeFormat),
  };
};

const parseDeclaredLabelToFormValue = (label?: string): string => {
  if (!label) {
    return AdsCategoryOtherValue;
  }

  const normalizedLabel = label.startsWith(AD_POLICY_REVIEW_LABEL_PREFIX)
    ? label.slice(AD_POLICY_REVIEW_LABEL_PREFIX.length)
    : label;

  return normalizedLabel === UNSPECIFIED_DECLARED_LABEL ? AdsCategoryOtherValue : normalizedLabel;
};

const getAdsCategoryDeclaredLabel = (declaredLabels?: string[]): string | undefined =>
  declaredLabels?.find((label) => label !== REWARDED_INTEGRATION_DECLARED_LABEL);

const getHasRewardedPlacements = (declaredLabels?: string[]): boolean | undefined =>
  declaredLabels?.includes(REWARDED_INTEGRATION_DECLARED_LABEL);

const buildDeclaredLabels = (payload: AdIntegrationCampaignDetailsFormValues): string[] => [
  ...(payload.adsCategory
    ? [
        payload.adsCategory === AdsCategoryOtherValue
          ? UNSPECIFIED_DECLARED_LABEL
          : payload.adsCategory,
      ]
    : []),
  ...(payload.hasRewardedPlacements ? [REWARDED_INTEGRATION_DECLARED_LABEL] : []),
];

const mapCampaignResponseToFormValues = (
  campaign:
    | {
        advertiserDisclosureName?: string;
        declaredLabels?: string[];
        endTimestampMs?: number;
        name?: string;
        startTimestampMs?: number;
        universeId?: number;
      }
    | null
    | undefined,
  timezoneDbName: string,
  formFallbacks?: Pick<
    AdIntegrationCampaignDetailsFormValues,
    'hasRewardedPlacements' | 'termsAndAdsStandardsAcknowledgement'
  >,
): AdIntegrationCampaignDetailsFormValues => {
  const start = formatApiTimestampToFormValues(campaign?.startTimestampMs, timezoneDbName);
  const end = formatApiTimestampToFormValues(campaign?.endTimestampMs, timezoneDbName);
  const hasRewardedPlacements =
    getHasRewardedPlacements(campaign?.declaredLabels) ??
    formFallbacks?.hasRewardedPlacements ??
    false;

  return {
    adsCategory: parseDeclaredLabelToFormValue(
      getAdsCategoryDeclaredLabel(campaign?.declaredLabels),
    ),
    advertiserName: campaign?.advertiserDisclosureName ?? '',
    campaignName: campaign?.name ?? '',
    endDate: end.date,
    endTime: end.time,
    experience: campaign?.universeId ?? 0,
    hasRewardedPlacements,
    startDate: start.date,
    startTime: start.time,
    termsAndAdsStandardsAcknowledgement: formFallbacks?.termsAndAdsStandardsAcknowledgement ?? true,
  };
};

const mapFormToCreateRequest = (
  payload: AdIntegrationCampaignDetailsFormValues,
  timezoneDbName: string,
): CreateAdIntegrationCampaignRequest => {
  const declaredLabels = buildDeclaredLabels(payload);

  return {
    advertiserDisclosureName: payload.advertiserName.trim(),
    ...(declaredLabels.length > 0 ? { declaredLabels } : {}),
    endTimestampMs: formatDateTimeToApiTimestamp(payload.endDate, payload.endTime, timezoneDbName),
    name: payload.campaignName.trim(),
    startTimestampMs: formatDateTimeToApiTimestamp(
      payload.startDate,
      payload.startTime,
      timezoneDbName,
    ),
    universeId: payload.experience,
  };
};

const mapFormToUpdateRequest = (
  payload: AdIntegrationCampaignDetailsFormValues,
  timezoneDbName: string,
  changedFields?: AdIntegrationCampaignDetailsChangedFields,
): UpdateAdIntegrationCampaignRequest => {
  const shouldIncludeField = (field: keyof AdIntegrationCampaignDetailsFormValues): boolean => {
    if (!changedFields) {
      return true;
    }

    return Boolean(changedFields[field]);
  };

  const updateRequest: UpdateAdIntegrationCampaignRequest = {};

  if (shouldIncludeField('advertiserName')) {
    updateRequest.advertiserDisclosureName = payload.advertiserName.trim();
  }

  if (shouldIncludeField('endDate') || shouldIncludeField('endTime')) {
    updateRequest.endTimestampMs = formatDateTimeToApiTimestamp(
      payload.endDate,
      payload.endTime,
      timezoneDbName,
    );
  }

  if (shouldIncludeField('campaignName')) {
    updateRequest.name = payload.campaignName.trim();
  }

  if (shouldIncludeField('hasRewardedPlacements')) {
    updateRequest.declaredLabels = buildDeclaredLabels(payload);
  }

  if (shouldIncludeField('startDate') || shouldIncludeField('startTime')) {
    updateRequest.startTimestampMs = formatDateTimeToApiTimestamp(
      payload.startDate,
      payload.startTime,
      timezoneDbName,
    );
  }

  return updateRequest;
};

const listAdIntegrationCampaignsByUniverse = async (
  universeId: number,
  cursor?: string,
): Promise<{
  campaigns: AdIntegrationCampaign[];
  nextCursor?: string;
}> => {
  const response = await adIntegrationsClient.listAdIntegrationCampaignsByUniverse({
    cursor,
    pageSize: AD_INTEGRATIONS_LIST_PAGE_SIZE,
    universeId: universeId.toString(),
  });

  return {
    campaigns: response.campaigns ?? [],
    nextCursor: response.nextCursor,
  };
};

const listAllAdIntegrationCampaignsByUniverse = async (
  universeId: number,
): Promise<AdIntegrationCampaign[]> => {
  const campaigns: AdIntegrationCampaign[] = [];
  let nextCursor: string | undefined;

  do {
    // Cursor pagination is sequential by design; each request depends on prior nextCursor.
    // eslint-disable-next-line no-await-in-loop
    const response = await listAdIntegrationCampaignsByUniverse(universeId, nextCursor);
    campaigns.push(...response.campaigns);
    nextCursor = response.nextCursor;
  } while (nextCursor);

  return campaigns;
};

const mapPublisherEligibleUniverseToUniverseShape = (
  universe: PublisherEligibleUniverse,
): UniverseShapeType | undefined => {
  if (typeof universe.universeId !== 'number' || typeof universe.universeName !== 'string') {
    return undefined;
  }

  return {
    privacy_type: PUBLIC_UNIVERSE_PRIVACY_TYPE,
    root_place_id: 0,
    universe_id: universe.universeId,
    universe_name: universe.universeName,
  };
};

export const listPublisherEligibleUniverses =
  async (): Promise<ListUniversesCanAdvertiseResponse> => {
    const response = await adIntegrationsClient.listPublisherEligibleUniverse();
    const universes =
      response.universes
        ?.map(mapPublisherEligibleUniverseToUniverseShape)
        .filter((universe): universe is UniverseShapeType => universe !== undefined) ?? [];

    return { universes };
  };

// Normalizes the persisted revenue share snapshot on a campaign into the raw
// signals shape the preview hook consumes. Returns undefined when the campaign
// has no saved estimate (created before the feature) or is missing the universe
// or any required signal, so callers fall back to fetching from Frost.
const mapCampaignToSavedRevenueShareSignals = (
  campaign?: AdIntegrationCampaign,
): RevenueShareEstimatePreview | undefined => {
  const estimate = campaign?.revenueShareEstimate;
  if (
    !estimate ||
    campaign?.universeId === undefined ||
    estimate.avgDailyVisits === undefined ||
    estimate.weightedCptvMicroUsd === undefined
  ) {
    return undefined;
  }

  return {
    avgDailyVisits: estimate.avgDailyVisits,
    universeId: campaign.universeId,
    weightedCptvMicroUsd: estimate.weightedCptvMicroUsd,
  };
};

export const getAdIntegrationCampaignDetails = async (
  campaignId: string,
  timezoneDbName: string,
): Promise<AdIntegrationCampaignWithPlacements> => {
  const response = await adIntegrationsClient.getAdIntegrationCampaignById({
    id: campaignId,
  });

  return {
    campaignCreatedTimestampMs: response.campaign?.createdTimestampMs,
    campaignEndTimestampMs: response.campaign?.endTimestampMs,
    campaignModerationStatus: response.campaign?.moderationStatus,
    campaignStartTimestampMs: response.campaign?.startTimestampMs,
    campaignStatus: response.campaign?.status,
    formValues: mapCampaignResponseToFormValues(response.campaign, timezoneDbName),
    placements: response.placements ?? [],
    savedRevenueShareSignals: mapCampaignToSavedRevenueShareSignals(response.campaign),
  };
};

export interface CreateAdIntegrationCampaignResult {
  campaignId?: string;
  formValues: AdIntegrationCampaignDetailsFormValues;
}

export const createAdIntegrationCampaignDetails = async (
  payload: AdIntegrationCampaignDetailsFormValues,
  timezoneDbName: string,
): Promise<CreateAdIntegrationCampaignResult> => {
  const response = await adIntegrationsClient.createAdIntegrationCampaign({
    request: mapFormToCreateRequest(payload, timezoneDbName),
  });

  return {
    campaignId: response.campaign?.id,
    formValues: mapCampaignResponseToFormValues(response.campaign, timezoneDbName, {
      hasRewardedPlacements: payload.hasRewardedPlacements,
      termsAndAdsStandardsAcknowledgement: payload.termsAndAdsStandardsAcknowledgement,
    }),
  };
};

export const updateAdIntegrationCampaignDetails = async (
  campaignId: string,
  payload: AdIntegrationCampaignDetailsFormValues,
  timezoneDbName: string,
  changedFields?: AdIntegrationCampaignDetailsChangedFields,
): Promise<AdIntegrationCampaignDetailsFormValues> => {
  const updateRequest = mapFormToUpdateRequest(payload, timezoneDbName, changedFields);
  if (Object.keys(updateRequest).length === 0) {
    return payload;
  }

  const response = await adIntegrationsClient.updateAdIntegrationCampaignById({
    id: campaignId,
    request: updateRequest,
  });

  return mapCampaignResponseToFormValues(response.campaign, timezoneDbName, {
    hasRewardedPlacements: payload.hasRewardedPlacements,
    termsAndAdsStandardsAcknowledgement: payload.termsAndAdsStandardsAcknowledgement,
  });
};

export const listAdIntegrationCampaignListItemsByUniverse = async (
  universeId: number,
  universeName: string,
): Promise<AdIntegrationCampaignListItem[]> => {
  const campaigns = (await listAllAdIntegrationCampaignsByUniverse(universeId)).filter(
    (campaign): campaign is AdIntegrationCampaign & { id: string } => Boolean(campaign.id),
  );

  return campaigns.map((campaign) => ({
    campaignId: campaign.id,
    campaignName: campaign.name ?? '',
    createdTimestampMs: campaign.createdTimestampMs,
    endTimestampMs: campaign.endTimestampMs,
    moderationStatus: campaign.moderationStatus,
    startTimestampMs: campaign.startTimestampMs,
    status: campaign.status,
    universeId: campaign.universeId ?? universeId,
    universeName,
  }));
};

export const addPlacementToAdIntegration = async (
  campaignId: string,
  assetId: number,
): Promise<AdIntegrationPlacement | undefined> => {
  const response = await adIntegrationsClient.addPlacementToAdIntegration({
    id: campaignId,
    request: { assetId },
  });
  return response.placement;
};

export const removePlacementFromAdIntegration = async (
  campaignId: string,
  placementId: string,
): Promise<void> => {
  await adIntegrationsClient.removePlacementFromAdIntegration({
    id: campaignId,
    placementId,
  });
};

export const getAssetDetails = async (assetIds: number[]): Promise<AssetDetails[]> => {
  if (assetIds.length === 0) {
    return [];
  }
  const response = await developClient.get<AssetDetailsApiResponse>({
    url: `/v1/assets?assetIds=${assetIds.join(',')}`,
  });
  return response.data?.data ?? [];
};

// Fetches the raw per-universe revenue share signals (avg daily visits +
// weighted CPTV) used to compute the max revenue share preview. The endpoint
// returns ONLY the raw signals; callers compute the max revenue share locally
// via @utils/revenueShareEstimate. The generated client exposes the fields as
// optional camelCase, so we normalize them into the required
// RevenueShareEstimatePreview shape.
export const getRevenueShareEstimatePreview = async (
  universeId: number,
  signal?: AbortSignal,
): Promise<RevenueShareEstimatePreview | undefined> => {
  const response = await adIntegrationsClient.getAdIntegrationRevenueShareEstimatePreview(
    { universeId },
    { signal },
  );

  // A successful response can still omit signals when Frost has no data for the
  // universe yet. Don't coerce those to 0 — that would render a confident
  // "$0.00" max cost / CPTV that is indistinguishable from a real zero. Return
  // undefined so the hook leaves the tile/drawer in their "--" placeholder state.
  if (response.avgDailyVisits === undefined || response.weightedCptvMicroUsd === undefined) {
    return undefined;
  }

  return {
    avgDailyVisits: response.avgDailyVisits,
    universeId: response.universeId ?? universeId,
    weightedCptvMicroUsd: response.weightedCptvMicroUsd,
  };
};

export const updateAdIntegrationCampaignStatus = async (
  campaignId: string,
  status: AdIntegrationCampaignStatus,
): Promise<void> => {
  await adIntegrationsClient.updateAdIntegrationCampaignById({
    id: campaignId,
    request: {
      status,
    },
  });
};
