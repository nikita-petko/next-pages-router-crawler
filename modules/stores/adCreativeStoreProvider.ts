import { create } from 'zustand';

interface StateType {
  assetIdToUrl: Map<number, string>;
}

interface ActionsType {
  updateAssetIdToUrl: (key: number, value: string) => void;
}

interface adCreativeStoreType extends StateType, ActionsType {}

export const useAdCreativeAssetStore = create<adCreativeStoreType>((set) => ({
  assetIdToUrl: new Map<number, string>(),
  updateAssetIdToUrl: (key: number, value: string) =>
    set((state: StateType) => ({ assetIdToUrl: state.assetIdToUrl.set(key, value) })),
}));
