/** Kebab-case wire ids registered in modal-history-service ModalConfigurations (Mosaic). */
export const CUE_MODAL_IDS = {
  AUTO_RELOAD_AD_CREDIT_TIP: 'ads-manager-auto-reload-ad-credit-tip',
} as const;

export type CueModalId = (typeof CUE_MODAL_IDS)[keyof typeof CUE_MODAL_IDS];
