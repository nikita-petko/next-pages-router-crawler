import { create } from 'zustand';

import {
  AdDisplayStatusType,
  AdSetDisplayStatusType,
  CampaignDisplayStatusType,
} from '@constants/campaignStatus';
import {
  GetAdSetStatusResponseType,
  GetAdStatusResponseType,
  GetCampaignStatusResponseType,
  GetUpdatedStatusesResponseType,
} from '@type/campaign';

interface StateType {
  adSetStatuses: Map<string, GetAdSetStatusResponseType>;
  adStatuses: Map<string, GetAdStatusResponseType>;
  campaignStatuses: Map<string, GetCampaignStatusResponseType>;
}

interface ActionsType {
  replaceAdSetStatuses: (newStatuses: Map<string, GetAdSetStatusResponseType>) => void;
  replaceAdStatuses: (newStatuses: Map<string, GetAdStatusResponseType>) => void;
  replaceCampaignStatuses: (newStatuses: Map<string, GetCampaignStatusResponseType>) => void;
  resetStatuses: () => void;
  setErrorStatuses: (ids: StatusIdList) => void;
  updateStatuses: (response: GetUpdatedStatusesResponseType) => void;
}

interface StatusIdList {
  adIds: string[];
  adSetIds: string[];
  campaignId: string;
}

const initialDisplayStatuses: StateType = {
  adSetStatuses: new Map<string, GetAdSetStatusResponseType>(),
  adStatuses: new Map<string, GetAdStatusResponseType>(),
  campaignStatuses: new Map<string, GetCampaignStatusResponseType>(),
};

export interface DisplayStatusesStoreType extends StateType, ActionsType {}

export const useDisplayStatusesStore = create<DisplayStatusesStoreType>((set, get) => ({
  ...initialDisplayStatuses,
  replaceAdSetStatuses: (newStatuses: Map<string, GetAdSetStatusResponseType>) => {
    set(() => ({ adSetStatuses: newStatuses }));
  },
  replaceAdStatuses: (newStatuses: Map<string, GetAdStatusResponseType>) => {
    set(() => ({ adStatuses: newStatuses }));
  },
  replaceCampaignStatuses: (newStatuses: Map<string, GetCampaignStatusResponseType>) => {
    set(() => ({ campaignStatuses: newStatuses }));
  },
  resetStatuses: () => {
    set(initialDisplayStatuses);
  },
  setErrorStatuses: (ids: StatusIdList) => {
    const newCampaignStatuses = new Map(get().campaignStatuses).set(ids.campaignId, {
      disabled: true,
      display_status: CampaignDisplayStatusType.CAMPAIGN_DISPLAY_STATUS_ERROR,
      id: ids.campaignId,
      is_on: false,
    });
    const newAdSetStatuses = new Map(get().adSetStatuses);
    ids.adSetIds.map((id: string) =>
      newAdSetStatuses.set(id, {
        disabled: true,
        display_status: AdSetDisplayStatusType.AD_SET_DISPLAY_STATUS_ERROR,
        id,
        is_on: false,
      }),
    );
    const newAdStatuses = new Map(get().adStatuses);
    ids.adIds.map((id: string) =>
      newAdStatuses.set(id, {
        disabled: true,
        display_status: AdDisplayStatusType.AD_DISPLAY_STATUS_ERROR,
        id,
        is_on: false,
      }),
    );
    set(() => ({
      adSetStatuses: newAdSetStatuses,
      adStatuses: newAdStatuses,
      campaignStatuses: newCampaignStatuses,
    }));
  },
  updateStatuses: (response: GetUpdatedStatusesResponseType) => {
    const oldCampaignStatuses = get().campaignStatuses;
    const newCampaignStatuses = new Map(oldCampaignStatuses).set(
      response.campaign_status.id,
      response.campaign_status,
    );
    const newAdSetStatuses = new Map(get().adSetStatuses);
    response.ad_set_statuses.map((status: GetAdSetStatusResponseType) =>
      newAdSetStatuses.set(status.id, status),
    );
    const newAdStatuses = new Map(get().adStatuses);
    response.ad_statuses.map((status: GetAdStatusResponseType) =>
      newAdStatuses.set(status.id, status),
    );
    set(() => ({
      adSetStatuses: newAdSetStatuses,
      adStatuses: newAdStatuses,
      campaignStatuses: newCampaignStatuses,
    }));
  },
}));
