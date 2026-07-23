import { ModalHistoryApi } from '@rbx/client-developer-analytics-aggregations/v1';
import { createClientConfiguration } from '../utils/createClientConfiguration';

const configuration = createClientConfiguration('developer-analytics-aggregations', 'bedev2');

const modalHistoryApi = new ModalHistoryApi(configuration);

/**
 * Front-end registry of modal IDs accepted by the modal-history endpoints
 * on `developer-analytics-aggregations`. The BE endpoint accepts any string
 * and forwards it to the modal-history service, so new IDs only need to be
 * added here (and registered in Obelix). See
 * `apps/creator-hub/modules/experience-analytics-shared/docs/ONBOARDING_TIPS.md`.
 */
export const ModalId = {
  CreatorHubAnalyticsAcquisitionRfy: 'creator-hub-analytics-acquisition-rfy',
  CreatorHubAnalyticsOverviewL7Metrics: 'creator-hub-analytics-overview-l7-metrics',
  CreatorHubAnalyticsHistoricalInsights: 'creator-hub-analytics-historical-insights',
  CreatorHubAnalyticsImmersiveAdsRewardedVideo:
    'creator-hub-analytics-immersive-ads-rewarded-video',
  CreatorHubAnalyticsErrorReportRules: 'creator-hub-analytics-error-report-rules',
  AdsManagerAutoReloadAdCreditTip: 'ads-manager-auto-reload-ad-credit-tip',
} as const;
export type ModalId = (typeof ModalId)[keyof typeof ModalId];

export type ModalHistoryClientWrapper = {
  shouldUserSeeModal(modalId: ModalId): Promise<boolean>;
  recordUserSeenModal(modalId: ModalId): Promise<boolean>;
};

const modalHistoryClient: ModalHistoryClientWrapper = {
  shouldUserSeeModal: async (modalId: ModalId) => {
    const response = await modalHistoryApi.modalHistoryShouldUserSeeModal({ modalId });
    return response.shouldSeeModal;
  },
  recordUserSeenModal: async (modalId: ModalId) => {
    const response = await modalHistoryApi.modalHistoryRecordUserSeenModal({ modalId });
    return response.shouldSeeModal;
  },
};

export default modalHistoryClient;
