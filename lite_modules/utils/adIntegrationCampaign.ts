import { parseAdIntegrationCampaignStatus } from '@services/ads/adIntegrationCampaignService';

export const isAdIntegrationCampaignStatusEnabled = (status?: string): boolean =>
  parseAdIntegrationCampaignStatus(status) === 'ENABLED';

export const isAdIntegrationCampaignStatusArchived = (status?: string): boolean =>
  parseAdIntegrationCampaignStatus(status) === 'ARCHIVED';

export const isAdIntegrationCampaignEndedByTimestamp = (endTimestampMs?: number): boolean =>
  Boolean(endTimestampMs) && endTimestampMs! < Date.now();
