import { create } from 'zustand';

import { FilterRefresh } from '@modules/filtering/utils/filterEnums';

interface StateType {
  refreshFilter: FilterRefresh;
}

interface ActionsType {
  setRefreshFilter: (newValue: FilterRefresh) => void;
}

interface FilteringStoreType extends StateType, ActionsType {}

const useFilteringStore = create<FilteringStoreType>((set) => ({
  refreshFilter: FilterRefresh.FILTER_REFRESH_UNSPECIFIED, // Refresh filter indicates whether we need to refetch filter results and how
  setRefreshFilter: (newValue: FilterRefresh) => set({ refreshFilter: newValue }),
}));

export default useFilteringStore;
