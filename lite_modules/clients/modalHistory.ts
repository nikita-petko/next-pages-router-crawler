import { ModalHistoryApi } from '@rbx/client-developer-analytics-aggregations/v1';
import { Configuration } from '@rbx/clients-core';
import type { ModalHistoryPort } from '@rbx/cueing/core';

import { unifiedLogger } from '@clients/unifiedLogger';
import { GetBEDEV2ServiceBasePath, GetSitetestBaseUrl } from '@utils/url';

const configuration = new Configuration({
  basePath: GetBEDEV2ServiceBasePath('developer-analytics-aggregations'),
  credentials: 'include',
  robloxSiteDomain: GetSitetestBaseUrl(),
  unifiedLogger,
});

const modalHistoryApi = new ModalHistoryApi(configuration);

const modalHistoryClient: ModalHistoryPort = {
  recordUserSeenModal: async (modalId) => {
    const response = await modalHistoryApi.modalHistoryRecordUserSeenModal({
      modalId,
    });
    return response.shouldSeeModal;
  },
  shouldUserSeeModal: async (modalId) => {
    const response = await modalHistoryApi.modalHistoryShouldUserSeeModal({
      modalId,
    });
    return response.shouldSeeModal;
  },
};

export default modalHistoryClient;
