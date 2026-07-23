import { AdIntegrationPlacementStatus } from '@utils/adIntegrationPlacementStatus';

export type CampaignModerationStatus = 'APPROVED' | 'IN_REVIEW' | 'LIMITED' | 'REJECTED';

const campaignModerationTooltipBodyKeyMap = new Map<CampaignModerationStatus, string>([
  ['REJECTED', 'Description.CampaignModerationRejected'],
  ['IN_REVIEW', 'Description.CampaignModerationInReview'],
  ['LIMITED', 'Description.CampaignModerationLimited'],
]);

const campaignModerationStatusLabelKeyMap = new Map<CampaignModerationStatus, string>([
  ['REJECTED', 'Label.Rejected'],
  ['IN_REVIEW', 'Label.InReview'],
  ['LIMITED', 'Label.ModerationStatusLimited'],
]);

const assetModerationTooltipBodyKeyMap = new Map<AdIntegrationPlacementStatus, string>([
  [AdIntegrationPlacementStatus.Rejected, 'Description.AssetModerationRejected'],
  [AdIntegrationPlacementStatus.InReview, 'Description.AssetModerationInReview'],
  [AdIntegrationPlacementStatus.Limited, 'Description.AssetModerationLimited'],
]);

const STATUSES_WITH_VIEW_DETAILS = new Set<CampaignModerationStatus>(['REJECTED', 'LIMITED']);

export const getCampaignModerationTooltipBodyKey = (
  status?: CampaignModerationStatus,
): string | undefined => (status ? campaignModerationTooltipBodyKeyMap.get(status) : undefined);

export const getCampaignModerationStatusLabelKey = (
  status?: CampaignModerationStatus,
): string | undefined => (status ? campaignModerationStatusLabelKeyMap.get(status) : undefined);

export const shouldShowCampaignViewDetails = (status?: CampaignModerationStatus): boolean =>
  status != null && STATUSES_WITH_VIEW_DETAILS.has(status);

export const getAssetModerationTooltipBodyKey = (
  status: AdIntegrationPlacementStatus,
): string | undefined => assetModerationTooltipBodyKeyMap.get(status);
