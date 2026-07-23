import { type CueConfig, CueLifecycle } from '@rbx/cueing/core';

import { CUE_MODAL_IDS, type CueModalId } from '@constants/cueModalIds';

export const CUE_REGISTRY = {
  [CUE_MODAL_IDS.AUTO_RELOAD_AD_CREDIT_TIP]: {
    analyticsDefaults: {
      cueKind: 'callout',
      surface: 'campaign-builder-budget',
    },
    emitAnalyticsOn: [CueLifecycle.Shown, CueLifecycle.Closed],
    persistSeenOn: [CueLifecycle.Closed],
  },
} as const satisfies Record<CueModalId, CueConfig>;
