import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { getPromotions } from '@services/ads/getPromotionsService';
import { PromotionType } from '@type/promotion';
import { GetInitialRequestState, RequestStateType } from '@utils/zustandUtils';

interface PromotionStoreStateType {
  promotions: RequestStateType<PromotionType[]>;
}

interface PromotionStoreActionType {
  getPromotions: () => void;
}

interface PromotionStoreType extends PromotionStoreStateType, PromotionStoreActionType {}

export const usePromotionStore = create<PromotionStoreType>()(
  immer((set) => ({
    getPromotions: async () => {
      try {
        set((draft) => {
          draft.promotions.isError = false;
          draft.promotions.isLoading = true;
        });
        const { promotions } = await getPromotions();

        set((draft) => {
          draft.promotions = {
            data: promotions,
            isError: false,
            isLoading: false,
          };
        });
      } catch {
        set((draft) => {
          draft.promotions.isError = true;
        });
      } finally {
        set((draft) => {
          draft.promotions.isLoading = false;
        });
      }
    },
    promotions: GetInitialRequestState<PromotionType[]>([]),
  })),
);
