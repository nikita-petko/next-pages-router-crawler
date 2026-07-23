import { create } from 'zustand';

interface ToastStoreStateType {
  showCancelSuccessful: boolean;
  showClaimPromotionError: boolean;
  showClaimPromotionSuccessful: boolean;
  showClaimPromotionWarning: boolean;
  showCreateSuccessful: boolean;
  showDisableAllAutoReloadError: boolean;
  showDisableAllAutoReloadSuccessful: boolean;
  showEditSuccessful: boolean;
  showPurchaseAdCreditError: boolean;
  showPurchaseAdCreditSuccessful: boolean;
}

interface ToastStoreActionType {
  clearCreateStackedToasts: () => void;
  clearManageStackedToasts: () => void;
  clearPaymentSettingsStackedToasts: () => void;
  setShowCancelSuccessful: (showCancelSuccessful: boolean) => void;
  setShowClaimPromotionError: (showClaimPromotionError: boolean) => void;
  setShowClaimPromotionSuccessful: (showClaimPromotionSuccessful: boolean) => void;
  setShowClaimPromotionWarning: (showClaimPromotionWarning: boolean) => void;
  setShowCreateSuccessful: (showCreateSuccessful: boolean) => void;
  setShowDisableAllAutoReloadError: (showDisableAllAutoReloadError: boolean) => void;
  setShowDisableAllAutoReloadSuccessful: (showDisableAllAutoReloadSuccessful: boolean) => void;
  setShowEditSuccessful: (showEditSuccessful: boolean) => void;
  setShowPurchaseAdCreditError: (showPurchaseAdCreditError: boolean) => void;
  setShowPurchaseAdCreditSuccessful: (showPurchaseAdCreditSuccessful: boolean) => void;
}

export interface ToastStoreType extends ToastStoreStateType, ToastStoreActionType {}

export const useToastStore = create<ToastStoreType>((set) => ({
  clearCreateStackedToasts: () =>
    set(() => ({
      showPurchaseAdCreditError: false,
      showPurchaseAdCreditSuccessful: false,
    })),
  clearManageStackedToasts: () =>
    set(() => ({
      showCancelSuccessful: false,
      showClaimPromotionError: false,
      showClaimPromotionSuccessful: false,
      showClaimPromotionWarning: false,
      showCreateSuccessful: false,
      showEditSuccessful: false,
    })),
  clearPaymentSettingsStackedToasts: () =>
    set(() => ({
      showDisableAllAutoReloadError: false,
      showDisableAllAutoReloadSuccessful: false,
    })),
  setShowCancelSuccessful: (showCancelSuccessful: boolean) => set(() => ({ showCancelSuccessful })),
  setShowClaimPromotionError: (showClaimPromotionError: boolean) =>
    set(() => ({ showClaimPromotionError })),
  setShowClaimPromotionSuccessful: (showClaimPromotionSuccessful: boolean) =>
    set(() => ({ showClaimPromotionSuccessful })),
  setShowClaimPromotionWarning: (showClaimPromotionWarning: boolean) =>
    set(() => ({ showClaimPromotionWarning })),
  setShowCreateSuccessful: (showCreateSuccessful: boolean) => set(() => ({ showCreateSuccessful })),
  setShowDisableAllAutoReloadError: (showDisableAllAutoReloadError: boolean) =>
    set(() => ({ showDisableAllAutoReloadError })),
  setShowDisableAllAutoReloadSuccessful: (showDisableAllAutoReloadSuccessful: boolean) =>
    set(() => ({ showDisableAllAutoReloadSuccessful })),
  setShowEditSuccessful: (showEditSuccessful: boolean) => set(() => ({ showEditSuccessful })),
  setShowPurchaseAdCreditError: (showPurchaseAdCreditError: boolean) =>
    set(() => ({ showPurchaseAdCreditError })),
  setShowPurchaseAdCreditSuccessful: (showPurchaseAdCreditSuccessful: boolean) =>
    set(() => ({ showPurchaseAdCreditSuccessful })),
  showCancelSuccessful: false,
  showClaimPromotionError: false,
  showClaimPromotionSuccessful: false,
  showClaimPromotionWarning: false,
  showCreateSuccessful: false,
  showDisableAllAutoReloadError: false,
  showDisableAllAutoReloadSuccessful: false,
  showEditSuccessful: false,
  showPurchaseAdCreditError: false,
  showPurchaseAdCreditSuccessful: false,
}));
