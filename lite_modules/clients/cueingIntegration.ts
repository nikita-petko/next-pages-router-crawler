import {
  configureCueing,
  type CueAnalyticsPort,
  type CueErrorPort,
  CueLifecycle,
  type CueLifecycleEvent,
} from '@rbx/cueing/core';

import modalHistoryClient from '@clients/modalHistory';
import { EventName, logNativeErrorEvent, logNativeImpressionEvent } from '@clients/unifiedLogger';
import { CUE_REGISTRY } from '@constants/cueRegistry';

const lifecycleToEventName = (lifecycle: CueLifecycleEvent): EventName => {
  if (lifecycle === CueLifecycle.Finished) {
    return EventName.CueCompleted;
  }
  if (lifecycle === CueLifecycle.Closed) {
    return EventName.CueDismissed;
  }
  return EventName.CueImpression;
};

const analytics: CueAnalyticsPort = {
  logLifecycle: (lifecycle, parameters) => {
    logNativeImpressionEvent(lifecycleToEventName(lifecycle), parameters);
  },
};

const onError: CueErrorPort = {
  log: (parameters, error) => {
    logNativeErrorEvent({ error, eventName: EventName.ApiEvent, parameters });
  },
};

export const initCueing = (): void => {
  configureCueing({
    analytics,
    modalHistory: modalHistoryClient,
    onError,
    registry: CUE_REGISTRY,
  });
};
