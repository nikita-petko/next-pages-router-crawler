import { create } from 'zustand';

import { TODOFIXANY } from 'app/shared/types';

interface StateType {
  adSetIdToNumChildren: Map<string, number>;
  campaignIdToNumChildren: Map<string, number>;
  numCampaigns: number;
}

interface ActionsType {
  replaceAdSetIdToNumChildren: (ads: TODOFIXANY[]) => void;
  replaceCampaignIdToNumChildren: (adSets: TODOFIXANY[]) => void;
  replaceNumCampaigns: (campaigns: TODOFIXANY[]) => void;
  resetLimitInfo: () => void;
}

const initialLimitInfo: StateType = {
  adSetIdToNumChildren: new Map<string, number>(),
  campaignIdToNumChildren: new Map<string, number>(),
  numCampaigns: 0,
};

interface LimitInfoType extends StateType, ActionsType {}

export const useLimitInfoStore = create<LimitInfoType>((set) => ({
  ...initialLimitInfo,
  replaceAdSetIdToNumChildren: (ads: TODOFIXANY[]) => {
    const adSetsMap: Map<string, number> = new Map<string, number>();

    ads.forEach((ad: TODOFIXANY) => {
      const adSetId = ad.ad_set_id;
      const parentCount = adSetsMap.get(adSetId);
      if (parentCount) {
        adSetsMap.set(adSetId, parentCount + 1);
      } else {
        adSetsMap.set(adSetId, 1);
      }
    });
    set(() => ({ adSetIdToNumChildren: adSetsMap }));
  },
  replaceCampaignIdToNumChildren: (adSets: TODOFIXANY[]) => {
    const campaignsMap: Map<string, number> = new Map<string, number>();

    adSets.forEach((adSet: TODOFIXANY) => {
      const campaignId = adSet.campaign_id;
      const parentCount = campaignsMap.get(campaignId);
      if (parentCount) {
        campaignsMap.set(campaignId, parentCount + 1);
      } else {
        campaignsMap.set(campaignId, 1);
      }
    });
    set(() => ({ campaignIdToNumChildren: campaignsMap }));
  },
  replaceNumCampaigns: (campaigns: TODOFIXANY[]) => {
    set(() => ({ numCampaigns: campaigns.length }));
  },
  resetLimitInfo: () => {
    set(initialLimitInfo);
  },
}));
