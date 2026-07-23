import { CUE_MODAL_IDS } from '@constants/cueModalIds';
import { Tooltips } from '@constants/tooltips';
import type { CueMigrationDefinition } from '@type/cueing';

export const AUTO_RELOAD_AD_CREDIT_CUE_MIGRATION = {
  legacyStorageKey: Tooltips.AUTO_RELOAD_AD_CREDIT_COACH_MARK.storageKey,
  modalId: CUE_MODAL_IDS.AUTO_RELOAD_AD_CREDIT_TIP,
  selectIsCueingEnabled: (metadata) => metadata?.isAutoReloadAdCreditCueingEnabled ?? false,
  tooltip: Tooltips.AUTO_RELOAD_AD_CREDIT_COACH_MARK,
} satisfies CueMigrationDefinition;
