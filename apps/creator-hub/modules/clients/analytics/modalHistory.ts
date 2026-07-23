import { Configuration } from '@rbx/clients';
// eslint-disable-next-line no-restricted-imports -- Legacy APIs
import { ModalHistoryApi, ModalId } from '@rbx/clients/developerAnalyticsAggregations/v1';
import { getBEDEV2ServiceBasePath } from '@modules/clients/utils';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';

const basePath = getBEDEV2ServiceBasePath('developer-analytics-aggregations');

const configuration = new Configuration({
  robloxSiteDomain: process.env.robloxSiteDomain,
  basePath,
  credentials: 'include',
  unifiedLogger: unifiedLoggerClient,
});

const modalHistoryApi = new ModalHistoryApi(configuration);
// eslint-disable-next-line no-restricted-imports -- Legacy APIs
export { ModalId } from '@rbx/clients/developerAnalyticsAggregations/v1';

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
