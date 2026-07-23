import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { getPaymentProfiles } from '@services/ads/paymentProfileService';
import { PaymentProfileType } from '@type/payment';
import { GetInitialRequestState, RequestStateType } from '@utils/zustandUtils';

interface PaymentStoreStateType {
  paymentProfiles: RequestStateType<PaymentProfileType[]>;
}

interface PaymentStoreActionType {
  getPaymentProfiles: (isAuthorizeOnly: boolean) => void;
}

interface PaymentStoreType extends PaymentStoreStateType, PaymentStoreActionType {}

export const usePaymentStore = create<PaymentStoreType>()(
  immer((set) => ({
    getPaymentProfiles: async (isAuthorizeOnly: boolean) => {
      try {
        set((draft) => {
          draft.paymentProfiles.isLoading = true;
          draft.paymentProfiles.isError = false;
        });
        const { data } = await getPaymentProfiles(isAuthorizeOnly);
        set((draft) => {
          draft.paymentProfiles = { data, isError: false, isLoading: false };
        });
      } catch (_error) {
        set((draft) => {
          draft.paymentProfiles.isError = true;
        });
      } finally {
        set((draft) => {
          draft.paymentProfiles.isLoading = false;
        });
      }
    },

    paymentProfiles: GetInitialRequestState<PaymentProfileType[]>([]),
  })),
);
